const prisma = require('../config/prisma');
const slugify = require('slugify');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse, createdResponse } = require('../utils/response');
const contentTranslationService = require('../services/contentTranslation.service');

exports.getAllCategories = asyncHandler(async (req, res) => {
  const { isHomeShown, search } = req.query;

  let query = {};

  if (isHomeShown === 'true') query.isHomeShown = true;

  if (search) {
    query.name = { contains: search, mode: 'insensitive' };
  }

  // Recursive function to include all nested children with translations
  const includeChildren = {
    include: {
      translations: true,
      children: {
        include: {
          translations: true,
          children: {
            include: {
              translations: true,
              children: {
                include: {
                  translations: true,
                  children: {
                    include: {
                      translations: true,
                      children: {
                        include: {
                          translations: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  // Fetch all categories first to be safe with parentId null/missing
  let categories = await prisma.category.findMany({
    where: query,
    orderBy: { order: 'asc' },
    ...includeChildren,
  });

  // If no search is performed, we only want root categories at the top level
  if (!search) {
    categories = categories.filter((c) => !c.parentId);
  }

  // Debug: Log category structure
  console.log('=== GET ALL CATEGORIES ===');
  console.log('Total root categories:', categories.length);
  categories.forEach((cat) => {
    console.log(
      `- ${cat.name} (id: ${cat.id}, parentId: ${cat.parentId}, children: ${cat.children?.length || 0})`
    );
    if (cat.children && cat.children.length > 0) {
      cat.children.forEach((child) => {
        console.log(`  - ${child.name} (id: ${child.id}, parentId: ${child.parentId})`);
      });
    }
  });

  return successResponse(res, {
    message: 'Categories retrieved successfully',
    data: categories,
  });
});

// Get single category by slug
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      translations: true,
      children: {
        include: {
          translations: true,
        },
      },
      products: {
        take: 10,
        include: {
          variants: true,
          translations: true,
        },
      },
    },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return successResponse(res, {
    message: 'Category retrieved successfully',
    data: category,
  });
});

// Create Category (Admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    isHomeShown,
    order,
    parentId,
    isActive,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;
  let { slug } = req.body;

  // Debug logging
  console.log('=== CREATE CATEGORY REQUEST ===');
  console.log('Name:', name);
  console.log('ParentId:', parentId);
  console.log('Body:', req.body);

  if (!slug) {
    slug = slugify(name, { lower: true });
  }

  // Check if slug exists
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw ApiError.conflict('Category with this slug already exists');
  }

  // Handle image upload from multer
  const imageUrl = req.file ? req.file.path : null;

  let parsedTranslations = [];
  if (req.body.translations) {
    try {
      parsedTranslations = JSON.parse(req.body.translations);
    } catch (e) {
      console.error('JSON Parse Error for translations:', e);
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      image: imageUrl,
      description,
      isHomeShown: isHomeShown === 'true' || isHomeShown === true || false,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      metaTitle,
      metaDescription,
      metaKeywords,
      order: order ? parseInt(order) : 0,
      parentId: parentId || null,
      translations: {
        create: parsedTranslations.map((t) => ({
          langCode: t.langCode,
          name: t.name,
          description: t.description,
        })),
      },
    },
  });

  console.log('Created category:', category.id, 'with parentId:', category.parentId);

  // Trigger background auto-translation
  contentTranslationService.autoTranslateCategoryForAll(category.id).catch(console.error);

  return createdResponse(res, {
    message: 'Category created successfully',
    data: category,
  });
});

// Update Category (Admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    slug,
    isHomeShown,
    order,
    parentId,
    isActive,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;

  const existingCategory = await prisma.category.findUnique({ where: { id } });
  if (!existingCategory) {
    throw ApiError.notFound('Category not found');
  }

  // Handle new image upload
  let imageUrl = existingCategory.image;
  if (req.file) {
    // Delete old image from Cloudinary if exists
    if (existingCategory.image) {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary.utils');
      await deleteImageFromCloudinary(existingCategory.image);
    }
    imageUrl = req.file.path;
  }

  const data = {
    name,
    image: imageUrl,
    description,
    isHomeShown:
      isHomeShown !== undefined ? isHomeShown === 'true' || isHomeShown === true : undefined,
    isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
    metaTitle,
    metaDescription,
    metaKeywords,
    order: order ? parseInt(order) : undefined,
    parentId: parentId === '' ? null : parentId || undefined, // Allow clearing parent
  };

  if (slug) {
    // Check if new slug conflicts (if changed)
    if (slug !== existingCategory.slug) {
      const slugConflict = await prisma.category.findUnique({ where: { slug } });
      if (slugConflict) {
        throw ApiError.conflict('Category with this slug already exists');
      }
      data.slug = slug;
    }
  }

  // Remove undefined
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  // Transactional update
  const operations = [];

  // 1. Update main category data
  operations.push(
    prisma.category.update({
      where: { id },
      data,
    })
  );

  // 2. Handle Translations
  if (req.body.translations) {
    let parsedTranslations = [];
    try {
      parsedTranslations = JSON.parse(req.body.translations);
    } catch (e) {
      console.error('JSON Parse Error for translations:', e);
    }

    // Delete existing translations
    operations.push(
      prisma.categoryTranslation.deleteMany({
        where: { categoryId: id },
      })
    );

    // Create new translations
    if (parsedTranslations.length > 0) {
      operations.push(
        prisma.categoryTranslation.createMany({
          data: parsedTranslations.map((t) => ({
            categoryId: id,
            langCode: t.langCode,
            name: t.name,
            description: t.description,
          })),
        })
      );
    }
  }

  await prisma.$transaction(operations);

  // Fetch updated category
  const category = await prisma.category.findUnique({
    where: { id },
    include: { translations: true },
  });

  // Trigger background auto-translation if content changed
  if (name || description !== undefined) {
    contentTranslationService.autoTranslateCategoryForAll(category.id, true).catch(console.error);
  }

  return successResponse(res, {
    message: 'Category updated successfully',
    data: category,
  });
});

// Delete Category (with recursive child deletion)
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { children: true },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Recursive function to delete category and all its children
  const deleteCategoryRecursive = async (categoryId) => {
    // Find category with children
    const cat = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (!cat) return;

    // Recursively delete all children first
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        await deleteCategoryRecursive(child.id);
      }
    }

    // Delete image from Cloudinary if exists
    if (cat.image) {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary.utils');
      await deleteImageFromCloudinary(cat.image);
    }

    // Delete the category from database
    await prisma.category.delete({ where: { id: categoryId } });
  };

  // Start recursive deletion
  await deleteCategoryRecursive(id);

  return successResponse(res, {
    message: 'Category and all child categories deleted successfully',
  });
});

// NEW: Update Category Structure (for Drag and Drop)
exports.updateCategoryStructure = asyncHandler(async (req, res) => {
  const { categories } = req.body; // Expect array of { id, parentId, order }

  if (!Array.isArray(categories)) {
    throw ApiError.badRequest('Categories array is required');
  }

  // Use transaction to update all
  const operations = categories.map((cat) =>
    prisma.category.update({
      where: { id: cat.id },
      data: {
        parentId: cat.parentId || null,
        order: cat.order,
      },
    })
  );

  await prisma.$transaction(operations);

  return successResponse(res, {
    message: 'Category structure updated successfully',
  });
});
