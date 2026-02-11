const { PrismaClient } = require("@prisma/client");
const createError = require("http-errors");
const slugify = require("slugify");
const prisma = new PrismaClient();

// Get all categories (Public)
exports.getAllCategories = async (req, res, next) => {
  try {
    const { isHomeShown, search } = req.query;
    const query = {};
    if (isHomeShown === 'true') query.isHomeShown = true;

    if (search) {
        query.name = { contains: search, mode: 'insensitive' };
    }

    // Fetch all to allow frontend to build tree, or filtered
    // For admin DnD we usually want all
    const categories = await prisma.category.findMany({
      where: query,
      orderBy: { order: 'asc' },
      include: {
        children: {
            include: { children: true } // Support 3 levels depth or just flat list
        },
      },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get single category by slug
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        products: {
            take: 10,
            include: { variants: true }
        }
      },
    });

    if (!category) {
      throw createError(404, "Category not found");
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Create Category (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, image, description, isHomeShown, order, icon, parentId } = req.body;
    let { slug } = req.body;

    if (!slug) {
        slug = slugify(name, { lower: true });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        image,
        description,
        isHomeShown: isHomeShown || false,
        order: order ? parseInt(order) : 0,
        icon,
        parentId: parentId || null
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Update Category (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, image, description, slug, isHomeShown, order, icon, parentId } = req.body;

    const data = {
        name, image, description,
        isHomeShown,
        icon,
        slug,
        order: order ? parseInt(order) : undefined,
        parentId: parentId || null // Allow clearing parent
    };

    if (slug) data.slug = slug;

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Category
exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({ where: { id } });
        res.status(200).json({ success: true, message: "Category deleted" });
    } catch (error) {
        next(error);
    }
};

// NEW: Update Category Structure (for Drag and Drop)
exports.updateCategoryStructure = async (req, res, next) => {
    try {
        const { categories } = req.body; // Expect array of { id, parentId, order }

        if (!Array.isArray(categories)) {
            throw createError(400, "Categories array is required");
        }

        // Use transaction to update all
        const operations = categories.map((cat) =>
            prisma.category.update({
                where: { id: cat.id },
                data: {
                    parentId: cat.parentId || null,
                    order: cat.order
                }
            })
        );

        await prisma.$transaction(operations);

        res.status(200).json({ success: true, message: "Structure updated" });
    } catch (error) {
        next(error);
    }
};
