const prisma = require('../config/prisma');
const slugify = require('slugify');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse, createdResponse } = require('../utils/response');
const contentTranslationService = require('../services/contentTranslation.service');
const { stripImagePrefix, formatImageUrl } = require('../utils/image.utils');

// Get all brands
exports.getAllBrands = asyncHandler(async (req, res) => {
  const { search, isActive, isFeatured, page, limit } = req.query;

  let query = {};

  if (isActive === 'true') {
    query.isActive = true;
  } else if (isActive === 'false') {
    query.isActive = false;
  }

  if (isFeatured === 'true') {
    query.isFeatured = true;
  } else if (isFeatured === 'false') {
    query.isFeatured = false;
  }

  if (search) {
    query.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Determine if pagination is requested (if page or limit is provided)
  const isPaginationEnabled = page !== undefined || limit !== undefined;
  
  let brands;
  let meta = null;

  if (isPaginationEnabled) {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const count = await prisma.brand.count({ where: query });
    
    brands = await prisma.brand.findMany({
      where: query,
      include: {
        translations: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { order: 'asc' },
      skip,
      take: parsedLimit,
    });

    const { paginationMeta } = require('../utils/response');
    meta = paginationMeta(parsedPage, parsedLimit, count);
  } else {
    brands = await prisma.brand.findMany({
      where: query,
      include: {
        translations: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { order: 'asc' },
    });
  }

  // Format brand image URLs using the image base URL utility
  brands = brands.map(brand => ({
    ...brand,
    image: formatImageUrl(brand.image)
  }));

  return successResponse(res, {
    message: 'Brands retrieved successfully',
    data: brands,
    meta,
  });
});

// Get single brand by slug
exports.getBrandBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      translations: true,
      products: {
        where: { status: 'PUBLISHED' },
        take: 20,
        include: {
          variants: true,
          translations: true,
        },
      },
    },
  });

  if (!brand) {
    throw ApiError.notFound('Brand not found');
  }

  const formattedBrand = {
    ...brand,
    image: formatImageUrl(brand.image),
  };

  return successResponse(res, {
    message: 'Brand retrieved successfully',
    data: formattedBrand,
  });
});

// Create Brand (Admin)
exports.createBrand = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    isActive,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;
  let { slug } = req.body;

  if (!slug) {
    slug = slugify(name, { lower: true });
  }

  // Check if slug exists
  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (existing) {
    throw ApiError.conflict('Brand with this slug already exists');
  }

  // Handle image upload from multer
  const imageUrl = req.file ? stripImagePrefix(req.file.path) : null;

  let parsedTranslations = [];
  if (req.body.translations) {
    try {
      parsedTranslations = JSON.parse(req.body.translations);
    } catch (e) {
      console.error('JSON Parse Error for brand translations:', e);
    }
  }

  const isFeaturedVal = req.body.isFeatured;

  const brand = await prisma.brand.create({
    data: {
      name,
      slug,
      image: imageUrl,
      description,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      isFeatured: isFeaturedVal !== undefined ? isFeaturedVal === 'true' || isFeaturedVal === true : false,
      metaTitle,
      metaDescription,
      metaKeywords,
      translations: {
        create: parsedTranslations.map((t) => ({
          langCode: t.langCode,
          name: t.name,
          description: t.description,
        })),
      },
      createdById: req.user ? req.user.id : null,
    },
    include: {
      translations: true,
    },
  });

  // Trigger background auto-translation
  contentTranslationService.autoTranslateBrandForAll(brand.id).catch(console.error);

  return createdResponse(res, {
    message: 'Brand created successfully',
    data: brand,
  });
});

// Update Brand (Admin)
exports.updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    slug,
    isActive,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;

  const existingBrand = await prisma.brand.findUnique({ where: { id } });
  if (!existingBrand) {
    throw ApiError.notFound('Brand not found');
  }

  // Handle new image upload
  let imageUrl = existingBrand.image;
  if (req.file) {
    // Delete old image from Cloudinary if exists
    if (existingBrand.image) {
      try {
        const { deleteImageFromCloudinary } = require('../utils/cloudinary.utils');
        await deleteImageFromCloudinary(existingBrand.image);
      } catch (err) {
        console.error('Error deleting brand image from Cloudinary:', err);
      }
    }
    imageUrl = stripImagePrefix(req.file.path);
  }

  const isFeatured = req.body.isFeatured;

  const data = {
    name,
    image: imageUrl,
    description,
    isActive: isActive !== undefined ? isActive === 'true' || isActive === true : undefined,
    isFeatured: isFeatured !== undefined ? isFeatured === 'true' || isFeatured === true : undefined,
    metaTitle,
    metaDescription,
    metaKeywords,
  };

  if (slug) {
    if (slug !== existingBrand.slug) {
      const slugConflict = await prisma.brand.findUnique({ where: { slug } });
      if (slugConflict) {
        throw ApiError.conflict('Brand with this slug already exists');
      }
      data.slug = slug;
    }
  }

  // Remove undefined
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const operations = [];

  // 1. Update main brand data
  operations.push(
    prisma.brand.update({
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
      console.error('JSON Parse Error for brand translations:', e);
    }

    // Delete existing translations
    operations.push(
      prisma.brandTranslation.deleteMany({
        where: { brandId: id },
      })
    );

    // Create new translations
    if (parsedTranslations.length > 0) {
      operations.push(
        prisma.brandTranslation.createMany({
          data: parsedTranslations.map((t) => ({
            brandId: id,
            langCode: t.langCode,
            name: t.name,
            description: t.description,
          })),
        })
      );
    }
  }

  await prisma.$transaction(operations);

  // Fetch updated brand
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: { translations: true },
  });

  // If brand name was updated, let's sync legacy string brand field in products of this brand
  if (name && name !== existingBrand.name) {
    await prisma.product.updateMany({
      where: { brandId: id },
      data: { brand: name },
    });
  }

  // Trigger background auto-translation if content changed
  if (name || description !== undefined) {
    contentTranslationService.autoTranslateBrandForAll(brand.id, true).catch(console.error);
  }

  return successResponse(res, {
    message: 'Brand updated successfully',
    data: brand,
  });
});

// Delete Brand (Admin)
exports.deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await prisma.brand.findUnique({
    where: { id },
  });

  if (!brand) {
    throw ApiError.notFound('Brand not found');
  }

  // Delete image from Cloudinary if exists
  if (brand.image) {
    try {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary.utils');
      await deleteImageFromCloudinary(brand.image);
    } catch (err) {
      console.error('Error deleting brand image from Cloudinary:', err);
    }
  }

  // Clear relationship in products of this brand, and legacy string sync
  await prisma.product.updateMany({
    where: { brandId: id },
    data: {
      brandId: null,
      brand: null,
    },
  });

  // Delete the brand from database
  await prisma.brand.delete({ where: { id } });

  return successResponse(res, {
    message: 'Brand deleted successfully',
  });
});

// Update Brands display order
exports.updateBrandsOrder = asyncHandler(async (req, res) => {
  const { brands } = req.body; // Expect array of { id, order }

  // Use transaction to update all
  const operations = brands.map((brand) =>
    prisma.brand.update({
      where: { id: brand.id },
      data: {
        order: parseInt(brand.order) || 0,
      },
    })
  );

  await prisma.$transaction(operations);

  return successResponse(res, {
    message: 'Brand order updated successfully',
  });
});
