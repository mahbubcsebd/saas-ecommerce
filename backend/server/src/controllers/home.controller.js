const prisma = require('../config/prisma');

/**
 * Get home page sections dynamically
 * Returns categories that should be shown on home with their products
 */
exports.getHomeSections = async (req, res, next) => {
  try {
    // Get categories marked for home display, ordered by 'order' field
    const categories = await prisma.category.findMany({
      where: {
        isHomeShown: true,
        parentId: null, // Only top-level categories
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    // For each category, fetch products (from category + all child categories)
    const sections = await Promise.all(
      categories.map(async (category) => {
        // Get IDs of this category and all its children
        const categoryIds = [category.id, ...category.children.map((c) => c.id)];

        const products = await prisma.product.findMany({
          where: {
            categoryId: {
              in: categoryIds, // Search in parent + all children
            },
            isActive: true,
          },
          take: 8,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            discount: true,
            variants: {
              where: { isActive: true },
              take: 5,
            },
          },
        });

        return {
          type: 'category',
          title: category.name,
          categorySlug: category.slug,
          order: category.order,
          products,
        };
      })
    );

    // Filter out sections with no products
    const sectionsWithProducts = sections.filter((s) => s.products.length > 0);

    res.status(200).json({
      success: true,
      data: {
        sections: sectionsWithProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
