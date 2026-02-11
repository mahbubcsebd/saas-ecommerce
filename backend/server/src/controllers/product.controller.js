const prisma = require('../config/prisma');
const slugify = require('slugify');
const { calculateProductDiscount } = require('../utils/calculateProductPrice');
const { generateSKU, generateBarcode } = require('../utils/product');

/**
 * Create Product with SKU & Barcode Auto-generation
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name, description, basePrice, costPrice, category, stock,
      tags, brand, isNewArrival, isFeatured, variants, images, status,
      metaTitle, metaDescription, metaKeywords, ogImage,
      categoryId, sku, barcode, weight, length, width, height,
      lowStockAlert, trackInventory
    } = req.body;

    // Auto-generate slug
    const slug = req.body.slug && req.body.slug.trim() !== ""
      ? req.body.slug
      : slugify(name, { lower: true, strict: true }) + '-' + Date.now();

    // Auto-generate SKU if not provided
    const productSKU = sku || await generateSKU(name, categoryId);

    // Auto-generate barcode if not provided
    const productBarcode = barcode || generateBarcode();

    // Calculate selling price (initially same as base price)
    const sellingPrice = basePrice;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        basePrice: parseFloat(basePrice),
        sellingPrice: parseFloat(sellingPrice),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sku: productSKU,
        barcode: productBarcode,
        categoryId: categoryId,
        stock: parseInt(stock) || 0,
        lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : 10,
        trackInventory: trackInventory !== false,
        images: images || [],
        tags: tags || [],
        brand,
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        isNewArrival: isNewArrival || false,
        isFeatured: isFeatured || false,
        status: status || 'DRAFT',
        metaTitle,
        metaDescription,
        metaKeywords,
        ogImage,
        variants: {
          create: variants?.map((v, index) => ({
            name: v.name,
            sku: v.sku || `${productSKU}-V${index + 1}`,
            barcode: v.barcode || generateBarcode(),
            basePrice: v.basePrice ? parseFloat(v.basePrice) : null,
            sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : null,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            images: v.images || [],
            attributes: v.attributes,
            isActive: v.isActive !== false
          }))
        }
      },
      include: {
        variants: true,
        category: true
      }
    });

    // Log initial stock movement
    if (stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantity: parseInt(stock),
          previousQty: 0,
          newQty: parseInt(stock),
          reason: 'Initial stock',
          performedBy: req.user?.id
        }
      });
    }

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Product with Inventory Tracking
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, description, basePrice, costPrice, category, stock,
      tags, brand, isNewArrival, isFeatured, variants, images, status, slug,
      metaTitle, metaDescription, metaKeywords, ogImage,
      categoryId, sku, barcode, weight, length, width, height,
      lowStockAlert, trackInventory
    } = req.body;

    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { stock: true }
    });

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = {
      name,
      description,
      basePrice: basePrice ? parseFloat(basePrice) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      categoryId: categoryId || undefined,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : undefined,
      trackInventory: trackInventory !== undefined ? trackInventory : undefined,
      images,
      tags,
      brand,
      weight: weight ? parseFloat(weight) : undefined,
      length: length ? parseFloat(length) : undefined,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      isNewArrival,
      isFeatured,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      sku,
      barcode
    };

    if (slug && slug.trim() !== "") data.slug = slug;

    // Remove undefined values
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    const operations = [];

    // Track stock changes
    if (stock !== undefined && stock !== currentProduct.stock) {
      const stockDiff = parseInt(stock) - currentProduct.stock;
      operations.push(
        prisma.stockMovement.create({
          data: {
            productId: id,
            type: 'ADJUSTMENT',
            quantity: stockDiff,
            previousQty: currentProduct.stock,
            newQty: parseInt(stock),
            reason: 'Manual stock update',
            performedBy: req.user?.id
          }
        })
      );
    }

    // Update product
    operations.push(
      prisma.product.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          variants: true,
          category: true
        }
      })
    );

    // Handle variants
    if (variants) {
      // Delete existing variants
      operations.push(
        prisma.productVariant.deleteMany({
          where: { productId: id }
        })
      );

      // Create new variants
      if (variants.length > 0) {
        operations.push(
          prisma.productVariant.createMany({
            data: variants.map((v, index) => ({
              productId: id,
              name: v.name,
              sku: v.sku || `${data.sku || 'SKU'}-V${index + 1}`,
              barcode: v.barcode || generateBarcode(),
              basePrice: v.basePrice ? parseFloat(v.basePrice) : null,
              sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : null,
              costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
              stock: parseInt(v.stock) || 0,
              images: v.images || [],
              attributes: v.attributes,
              isActive: v.isActive !== false
            }))
          })
        );
      }
    }

    const results = await prisma.$transaction(operations);
    const updatedProduct = results.find(r => r.id === id);

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Products with Active Discounts Applied
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category, search, page = 1, limit = 10, sort,
      minPrice, maxPrice, brand, isNewArrival, isFeatured,
      status, inStock
    } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    } else {
      // Default to PUBLISHED for public
      query.status = 'PUBLISHED';
    }

    // Category filter
    if (category) {
      const slugs = Array.isArray(category) ? category : [category];

      // Find categories and their children
      const categories = await prisma.category.findMany({
        where: { slug: { in: slugs } },
        select: {
          id: true,
          children: {
            select: { id: true }
          }
        }
      });

      // Flatten IDs (Category ID + Child IDs)
      let categoryIds = [];
      categories.forEach(cat => {
        categoryIds.push(cat.id);
        if (cat.children && cat.children.length > 0) {
          categoryIds = categoryIds.concat(cat.children.map(c => c.id));
        }
      });

      if (categoryIds.length > 0) {
        query.categoryId = { in: categoryIds };
      }
    }

    // Search filter
    if (search) {
      query.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Other filters
    if (isNewArrival === 'true') query.isNewArrival = true;
    if (isFeatured === 'true') query.isFeatured = true;
    if (brand) query.brand = brand;
    if (inStock === 'true') query.stock = { gt: 0 };

    // Price filter
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.gte = parseFloat(minPrice);
      if (maxPrice) query.sellingPrice.lte = parseFloat(maxPrice);
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { sellingPrice: 'asc' };
    if (sort === 'price-desc') orderBy = { sellingPrice: 'desc' };
    if (sort === 'name-asc') orderBy = { name: 'asc' };
    if (sort === 'popularity') orderBy = { soldCount: 'desc' };

    const products = await prisma.product.findMany({
      where: query,
      include: {
        variants: true,
        category: true,
        discounts: {
          where: {
            discount: {
              isActive: true,
              startDate: { lte: new Date() },
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } }
              ]
            }
          },
          include: {
            discount: true
          }
        }
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy
    });

    // Calculate discount for each product
    const productsWithDiscount = products.map(product => {
      const activeDiscounts = product.discounts
        .map(pd => pd.discount)
        .filter(d => d); // Filter out null discounts

      const discountAmount = calculateProductDiscount(product, activeDiscounts);
      const finalPrice = product.sellingPrice - discountAmount;

      return {
        ...product,
        discountAmount,
        finalPrice,
        hasDiscount: discountAmount > 0,
        discountPercentage: product.sellingPrice > 0
          ? Math.round((discountAmount / product.sellingPrice) * 100)
          : 0
      };
    });

    const count = await prisma.product.count({ where: query });

    res.status(200).json({
      success: true,
      data: productsWithDiscount,
      pagination: {
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Product with Discounts
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isId = id.match(/^[0-9a-fA-F]{24}$/);

    const product = await prisma.product.findFirst({
      where: isId ? { id } : { slug: id },
      include: {
        variants: true,
        category: true,
        reviews: {
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        discounts: {
          where: {
            discount: {
              isActive: true,
              startDate: { lte: new Date() },
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } }
              ]
            }
          },
          include: {
            discount: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } }
    });

    // Calculate discount
    const activeDiscounts = product.discounts
      .map(pd => pd.discount)
      .filter(d => d);

    const discountAmount = calculateProductDiscount(product, activeDiscounts);
    const finalPrice = product.sellingPrice - discountAmount;

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ...product,
        discountAmount,
        finalPrice,
        hasDiscount: discountAmount > 0,
        discountPercentage: product.sellingPrice > 0
          ? Math.round((discountAmount / product.sellingPrice) * 100)
          : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Product
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete product (cascade will handle variants, reviews, etc.)
    await prisma.product.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Related Products
 */
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, tags: true }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: id },
        status: 'PUBLISHED',
        OR: [
          { categoryId: product.categoryId },
          { tags: { hasSome: product.tags } }
        ]
      },
      include: {
        category: true,
        discounts: {
          where: {
            discount: {
              isActive: true,
              startDate: { lte: new Date() },
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } }
              ]
            }
          },
          include: {
            discount: true
          }
        }
      },
      take: limit,
      orderBy: { soldCount: 'desc' }
    });

    // Calculate discounts
    const productsWithDiscount = relatedProducts.map(p => {
      const activeDiscounts = p.discounts.map(pd => pd.discount).filter(d => d);
      const discountAmount = calculateProductDiscount(p, activeDiscounts);
      const finalPrice = p.sellingPrice - discountAmount;

      return {
        ...p,
        discountAmount,
        finalPrice,
        hasDiscount: discountAmount > 0
      };
    });

    res.status(200).json({
      success: true,
      data: productsWithDiscount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Low Stock Products (Admin)
 */
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        trackInventory: true,
        OR: [
          { stock: { lte: prisma.product.fields.lowStockAlert } }
        ]
      },
      include: {
        category: true,
        variants: {
          where: { stock: { lte: 5 } }
        }
      },
      orderBy: { stock: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    next(error);
  }
};