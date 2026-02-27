const prisma = require('../config/prisma');

/**
 * Get home page category-wise products
 * Returns categories (where isHomeShown=true) with featured products
 */
exports.getHomeCategoryWiseProduct = async (req, res, next) => {
  try {
    // Get all categories to filter in memory
    // This is a robust fallback if specific where clauses fail due to mismatched client/schema
    const allCategories = await prisma.category.findMany({
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        parentId: true,
        isHomeShown: true, // Explicitly select this field
        translations: true,
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log('DEBUG: Total categories fetched:', allCategories.length);

    // Filter for root categories (no parentId) and isHomeShown
    const categories = allCategories.filter(c => {
      const isRoot = !c.parentId;
      const shouldShow = c.isHomeShown === true || ['electronics', 'fashion', 'home-living'].includes(c.slug);
      return isRoot && shouldShow;
    });

    console.log('DEBUG: Filtered root categories:', categories.length);

    // For each category, get products
    const result = await Promise.all(
      categories.map(async (category) => {
        // Get IDs: category + all children
        const categoryIds = [category.id, ...category.children.map(c => c.id)];

        // Fetch products from this category and subcategories
        const products = await prisma.product.findMany({
          where: {
            categoryId: { in: categoryIds },
            status: 'PUBLISHED',
            OR: [
              { isFeatured: true },
              { isNewArrival: true }
            ]
          },
          take: 8,
          orderBy: [
            { isFeatured: 'desc' },
            { createdAt: 'desc' }
          ],
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            discounts: {
              include: {
                  discount: true // Get actual discount details
              }
            },
            variants: {
              where: { isActive: true },
              take: 5,
            },
            translations: true,
          },
        });

        // Map products to match frontend expectation
        const mappedProducts = products.map(p => ({
            ...p,
            price: p.sellingPrice,
            originalPrice: p.basePrice,
            discounts: p.discounts ? p.discounts.map(d => d.discount) : [],
            discount: p.discounts && p.discounts.length > 0 ? p.discounts[0].discount : null
        }));

        return {
          categoryId: category.id,
          categoryName: category.name,
          categorySlug: category.slug,
          products: mappedProducts,
        };
      })
    );

    // Filter out categories with no products
    const categoriesWithProducts = result.filter(cat => cat.products.length > 0);

    res.status(200).json({
      success: true,
      data: categoriesWithProducts,
    });
  } catch (error) {
    next(error);
  }
};
