const prisma = require('../config/prisma');
const slugify = require('slugify');
const { calculateProductDiscount } = require('../utils/calculateProductPrice');
const { generateSKU, generateBarcode } = require('../utils/product');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse, createdResponse } = require('../utils/response');
const contentTranslationService = require('../services/contentTranslation.service');

exports.createProduct = asyncHandler(async (req, res) => {
    try {
        const {
          name, description, basePrice, costPrice, category, stock,
          tags, brand, isNewArrival, isFeatured, variants, status,
          metaTitle, metaDescription, metaKeywords, ogImage,
          categoryId, sku, barcode, weight, length, width, height,
          lowStockAlert, trackInventory, isFreeShipping, isPreOrder,
          warranty, isHomeShown, homeOrder
        } = req.body;

        console.log("Create Product Body Types:", typeof req.body);
        console.log("Create Product Body Keys:", Object.keys(req.body));
        console.log("Create Product Variants Raw:", req.body.variants);

        // Helper to parse JSON if string
        const parseJSON = (data) => {
            if (typeof data === 'string') {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                    return [];
                }
            }
            return data;
        };

        // Helper for boolean
        const parseBoolean = (val) => val === 'true' || val === true;

        // Handle uploaded images (any() middleware puts all files in req.files)
        const allFiles = req.files || [];

        // Filter main product images
        const uploadedImages = allFiles
            .filter(file => file.fieldname === 'images')
            .map(file => file.path);

        // Auto-generate slug
        const slug = req.body.slug && req.body.slug.trim() !== ""
          ? req.body.slug
          : slugify(name, { lower: true, strict: true }) + '-' + Date.now();

        // Auto-generate SKU if not provided
        const productSKU = sku || await generateSKU(name, categoryId);

        // Auto-generate barcode if not provided
        const productBarcode = barcode || generateBarcode();

        // Calculate selling price
        const parsedBasePrice = parseFloat(basePrice);
        const sellingPrice = parsedBasePrice; // Initially same

        // Parse complex fields
        const parsedTags = parseJSON(tags) || [];
        const parsedVariants = parseJSON(variants) || [];
        const parsedTranslations = parseJSON(req.body.translations) || [];

        // Prepare data object
        const productData = {
            name,
            slug,
            description,
            basePrice: parsedBasePrice,
            sellingPrice: parseFloat(sellingPrice),
            costPrice: costPrice ? parseFloat(costPrice) : null,
            sku: productSKU,
            barcode: productBarcode,
            categoryId: categoryId,
            stock: parseInt(stock) || 0,
            lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : 10,
            trackInventory: trackInventory !== 'false', // Default true unless explicitly 'false'
            images: uploadedImages,
            tags: parsedTags,
            brand,
            weight: weight ? parseFloat(weight) : null,
            length: length ? parseFloat(length) : null,
            width: width ? parseFloat(width) : null,
            height: height ? parseFloat(height) : null,
            isNewArrival: parseBoolean(isNewArrival),
            isFeatured: parseBoolean(isFeatured),
            status: status || 'DRAFT',
            metaTitle,
            metaDescription,
            metaKeywords,
            ogImage,
            isFreeShipping: parseBoolean(isFreeShipping),
            isPreOrder: parseBoolean(isPreOrder),
            warranty,
            isHomeShown: parseBoolean(isHomeShown),
            homeOrder: homeOrder ? parseInt(homeOrder) : 0,
            variants: {
                create: parsedVariants.map((v, index) => {
                    // Extract variant images from uploads
                    const variantImages = allFiles
                        .filter(file => file.fieldname === `variant_${index}_images`)
                        .map(file => file.path);

                    // Combine with existing images if any (though create usually has none, but for robustness)
                    const finalVariantImages = [...(v.images || []), ...variantImages];

                    return {
                        name: v.name,
                        sku: v.sku || `${productSKU}-V${index + 1}`,
                        barcode: v.barcode || generateBarcode(),
                        basePrice: v.basePrice ? parseFloat(v.basePrice) : null,
                        sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : null,
                        costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
                        stock: parseInt(v.stock) || 0,
                        images: finalVariantImages,
                        attributes: v.attributes,
                        isActive: v.isActive !== false
                    };
                })
            },
            translations: {
                create: parsedTranslations.map(t => ({
                    langCode: t.langCode,
                    name: t.name,
                    description: t.description
                }))
            }
        };

        console.log("Prisma Create Data:", JSON.stringify(productData, null, 2));

        const product = await prisma.product.create({
          data: productData,
          include: {
            variants: true,
            category: true,
            translations: true
          }
        });

        // Log initial stock movement
        if (productData.stock > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              type: 'PURCHASE',
              quantity: productData.stock,
              previousQty: 0,
              newQty: productData.stock,
              reason: 'Initial stock',
              performedBy: req.user?.id
            }
          });
        }

        // Trigger background auto-translation
        contentTranslationService.autoTranslateProductForAll(product.id).catch(console.error);

        return createdResponse(res, {
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error("Create Product Error:", error);
        throw error;
    }
});

/**
 * Update Product with Inventory Tracking
 */
exports.updateProduct = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const {
          name, description, basePrice, costPrice, category, stock,
          tags, brand, isNewArrival, isFeatured, variants, status, slug,
          metaTitle, metaDescription, metaKeywords, ogImage,
          categoryId, sku, barcode, weight, length, width, height,
          lowStockAlert, trackInventory, keepExistingImages,
          isFreeShipping, isPreOrder, warranty, isHomeShown, homeOrder
        } = req.body;

        console.log("Update Product Body:", req.body);

         // Helper to parse JSON if string
         const parseJSON = (data) => {
            if (typeof data === 'string') {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                    return [];
                }
            }
            return data;
        };

        const parseBoolean = (val) => val === 'true' || val === true;

        // Handle uploaded images from Cloudinary
        const uploadedImages = req.files ? req.files.map(file => file.path) : [];

        // Get current product
        const currentProduct = await prisma.product.findUnique({
          where: { id },
          select: { stock: true, images: true, sellingPrice: true, slug: true, name: true }
        });

        if (!currentProduct) {
          throw ApiError.notFound('Product not found');
        }

        // Handle images
        let finalImages = uploadedImages;
        if (keepExistingImages === 'true' && currentProduct.images) {
          finalImages = [...currentProduct.images, ...uploadedImages];
        } else if (uploadedImages.length === 0 && currentProduct.images) {
          finalImages = currentProduct.images;
        }

        const data = {
          name,
          description,
          basePrice: basePrice ? parseFloat(basePrice) : undefined,
          costPrice: costPrice ? parseFloat(costPrice) : undefined,
          categoryId: categoryId || undefined,
          stock: stock !== undefined ? parseInt(stock) : undefined,
          lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : undefined,
          trackInventory: trackInventory !== undefined ? parseBoolean(trackInventory) : undefined,
          images: finalImages,
          tags: tags ? parseJSON(tags) : undefined,
          brand,
          weight: weight ? parseFloat(weight) : undefined,
          length: length ? parseFloat(length) : undefined,
          width: width ? parseFloat(width) : undefined,
          height: height ? parseFloat(height) : undefined,
          isNewArrival: isNewArrival !== undefined ? parseBoolean(isNewArrival) : undefined,
          isFeatured: isFeatured !== undefined ? parseBoolean(isFeatured) : undefined,
          status,
          metaTitle,
          metaDescription,
          metaKeywords,
          ogImage,
          sku,
          barcode,
          isFreeShipping: isFreeShipping !== undefined ? parseBoolean(isFreeShipping) : undefined,
          isPreOrder: isPreOrder !== undefined ? parseBoolean(isPreOrder) : undefined,
          warranty,
          isHomeShown: isHomeShown !== undefined ? parseBoolean(isHomeShown) : undefined,
          homeOrder: homeOrder !== undefined ? parseInt(homeOrder) : undefined,
        };

        if (slug && slug.trim() !== "") data.slug = slug;

        // Remove undefined values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const operations = [];

        // Track stock changes
        if (data.stock !== undefined && data.stock !== currentProduct.stock) {
          const stockDiff = data.stock - currentProduct.stock;
          operations.push(
            prisma.stockMovement.create({
              data: {
                productId: id,
                type: 'ADJUSTMENT',
                quantity: stockDiff,
                previousQty: currentProduct.stock,
                newQty: data.stock,
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
          const parsedVariants = parseJSON(variants);

          // Delete existing variants
          operations.push(
            prisma.productVariant.deleteMany({
              where: { productId: id }
            })
          );

          // Create new variants
          if (parsedVariants.length > 0) {
            operations.push(
              prisma.productVariant.createMany({
                data: parsedVariants.map((v, index) => ({
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

        // Handle Translations
        if (req.body.translations) {
            const parsedTranslations = parseJSON(req.body.translations);

             // Delete existing translations
             operations.push(
                prisma.productTranslation.deleteMany({
                    where: { productId: id }
                })
            );

            // Create new translations
            if (parsedTranslations.length > 0) {
                operations.push(
                    prisma.productTranslation.createMany({
                        data: parsedTranslations.map(t => ({
                            productId: id,
                            langCode: t.langCode,
                            name: t.name,
                            description: t.description
                        }))
                    })
                );
            }
        }

        const results = await prisma.$transaction(operations);
        // Fetch updated product with all relations
        const updatedProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: true,
                category: true,
                translations: true
            }
        });

        // Trigger background auto-translation if content changed
        if (name || description !== undefined) {
            contentTranslationService.autoTranslateProductForAll(updatedProduct.id, true).catch(console.error);
        }

        try {
          const wishlists = await prisma.wishlist.findMany({
            where: { productId: id },
            select: { userId: true }
          });

          const previousPrice = currentProduct.sellingPrice || 0;
          const newPrice = updatedProduct.sellingPrice || 0;
          const priceDropped = previousPrice > 0 && newPrice > 0 && newPrice < previousPrice;
          const backInStock = (currentProduct.stock === 0 || currentProduct.stock === null) && (updatedProduct.stock || 0) > 0;

          const isLowStock = updatedProduct.trackInventory && updatedProduct.stock <= (updatedProduct.lowStockAlert || 5);

          if ((priceDropped || backInStock) && wishlists.length > 0) {
            const productSlug = updatedProduct.slug || currentProduct.slug || updatedProduct.id;
            const url = `/products/${productSlug}`;

            // Notify Wishlist Users
            for (const w of wishlists) {
              if (priceDropped) {
                await NotificationService.notifyUser(w.userId, 'PRICE_DROP', 'Price Drop Alert', `${updatedProduct.name} is now ${newPrice} (was ${previousPrice})`, { productId: id, slug: productSlug, url });
              }
              if (backInStock) {
                await NotificationService.notifyUser(w.userId, 'PRODUCT_BACK_IN_STOCK', 'Back in Stock', `${updatedProduct.name} is back in stock`, { productId: id, slug: productSlug, url });
              }
            }
          }

          // Notify Admin if Low Stock
          if (isLowStock && currentProduct.stock > (updatedProduct.lowStockAlert || 5)) {
              // Only notify if it wasn't low before (to avoid spam on every update)
              await NotificationService.notifyAdmins(
                  'STOCK_LOW',
                  'Low Stock Alert',
                  `Product "${updatedProduct.name}" is running low (${updatedProduct.stock} remaining).`,
                  { productId: updatedProduct.id },
                  ['ADMIN', 'MANAGER']
              );
          }

        } catch (notifyErr) {
          console.warn('Product update notify error:', notifyErr?.message || notifyErr);
        }

        return successResponse(res, {
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error("Update Product Error:", error);
        throw error;
    }
});

/**
 * Get Products with Active Discounts Applied
 */
exports.getProducts = asyncHandler(async (req, res) => {
    const {
      category, search, page = 1, limit = 10, sort,
      minPrice, maxPrice, brand, isNewArrival, isFeatured,
      status, inStock
    } = req.query;

    const query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
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

    // SKU/Barcode filter
    const { sku, barcode } = req.query;
    if (sku) query.sku = { contains: sku, mode: 'insensitive' };
    if (barcode) query.barcode = { contains: barcode, mode: 'insensitive' };

    // Tags filter
    const { tags } = req.query;
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      query.tags = { hasSome: tagList };
    }

    // Date Range filter
    const { startDate, endDate } = req.query;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.gte = new Date(startDate);
      if (endDate) query.createdAt.lte = new Date(endDate);
    }

    // Stock Levels filter
    const { minStock, maxStock } = req.query;
    if (minStock || maxStock) {
      query.stock = {};
      if (minStock) query.stock.gte = parseInt(minStock);
      if (maxStock) query.stock.lte = parseInt(maxStock);
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-asc') orderBy = { sellingPrice: 'asc' };
    if (sort === 'price-desc') orderBy = { sellingPrice: 'desc' };
    if (sort === 'name-asc') orderBy = { name: 'asc' };
    if (sort === 'popularity') orderBy = { soldCount: 'desc' };

    try {
      const products = await prisma.product.findMany({
        where: query,
        include: {
          variants: true,
          category: true,
          translations: true,
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
        try {
          const activeDiscounts = product.discounts
            .map(pd => pd.discount)
            .filter(d => d); // Filter out null discounts

          // Ensure basePrice and sellingPrice are numbers to avoid NaN
          const safeProduct = {
            ...product,
            sellingPrice: product.sellingPrice || product.basePrice || 0
          };

          const discountAmount = calculateProductDiscount(safeProduct, activeDiscounts);
          const finalPrice = safeProduct.sellingPrice - discountAmount;

          return {
            ...product,
            discountAmount,
            finalPrice,
            hasDiscount: discountAmount > 0,
            discountPercentage: safeProduct.sellingPrice > 0
              ? Math.round((discountAmount / safeProduct.sellingPrice) * 100)
              : 0
          };
        } catch (err) {
          console.error(`Error calculating discount for product ${product.id}:`, err);
          return { ...product, discountAmount: 0, finalPrice: product.sellingPrice || product.basePrice || 0 };
        }
      });

      const count = await prisma.product.count({ where: query });
      const totalPages = Math.ceil(count / parseInt(limit));

      return successResponse(res, {
          message: 'Products retrieved successfully',
          data: productsWithDiscount,
          meta: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: count,
              totalPages,
          }
      });
    } catch (dbError) {
      console.error("Database or Query Error in getProducts:", dbError);
      // Fallback for admin if complex includes fail
      if (status === 'all') {
        const simpleProducts = await prisma.product.findMany({
          where: query,
          take: parseInt(limit),
          skip: (parseInt(page) - 1) * parseInt(limit),
          orderBy
        });
        return successResponse(res, {
            message: 'Products retrieved (Simple fallback)',
            data: simpleProducts.map(p => ({ ...p, discountAmount: 0, finalPrice: p.sellingPrice || p.basePrice || 0 })),
            meta: { page: parseInt(page), limit: parseInt(limit), total: simpleProducts.length, totalPages: 1 }
        });
      }
      throw dbError; // Re-throw if not admin or simple fallback also fails
    }
});

/**
 * Get Single Product with Discounts
 */
exports.getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isId = id.match(/^[0-9a-fA-F]{24}$/);

    const product = await prisma.product.findFirst({
      where: isId ? { id } : { slug: id },
      include: {
        variants: true,
        category: true,
        translations: true,
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
      throw ApiError.notFound('Product not found');
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

    return successResponse(res, {
        message: 'Product retrieved successfully',
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
});

/**
 * Delete Product
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if product exists before deleting
    const product = await prisma.product.findUnique({
      where: { id },
      select: { images: true }
    });

    if (!product) {
        throw ApiError.notFound('Product not found');
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary.utils');
      for (const imageUrl of product.images) {
        try {
          await deleteImageFromCloudinary(imageUrl);
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
        }
      }
    }

    // Delete product (cascade will handle variants, reviews, etc.)
    await prisma.product.delete({ where: { id } });

    return successResponse(res, {
        message: 'Product deleted successfully'
    });
});

/**
 * Get Related Products
 */
exports.getRelatedProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, tags: true }
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
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

    return successResponse(res, {
        message: 'Related products retrieved successfully',
        data: productsWithDiscount
    });
});

/**
 * Get Low Stock Products (Admin)
 */
exports.getLowStockProducts = asyncHandler(async (req, res) => {
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

    return successResponse(res, {
        message: 'Low stock products retrieved successfully',
        data: products,
        meta: {
            count: products.length
        }
    });
});

/**
 * Export Products to CSV
 */
exports.exportProducts = asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
        include: {
            category: true,
            variants: true
        }
    });

    // CSV Headers
    let csv = 'Name,SKU,Barcode,BasePrice,SellingPrice,Stock,Category,Status,Brand\n';

    // Add rows
    products.forEach(p => {
        const row = [
            `"${p.name.replace(/"/g, '""')}"`,
            p.sku || '',
            p.barcode || '',
            p.basePrice,
            p.sellingPrice,
            p.stock,
            p.category ? `"${p.category.name.replace(/"/g, '""')}"` : '',
            p.status,
            p.brand ? `"${p.brand.replace(/"/g, '""')}"` : ''
        ].join(',');
        csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    return res.status(200).send(csv);
});

/**
 * Import Products from CSV (Stub)
 */
exports.importProducts = asyncHandler(async (req, res) => {
    if (!req.files || !req.files[0]) {
        throw ApiError.badRequest('CSV file is required');
    }

    const fileContent = req.files[0].buffer.toString();
    const lines = fileContent.split(/\r?\n/);

    // Robust CSV parser (handles commas within quotes)
    const parseCSVLine = (line) => {
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        const matches = line.match(regex) || [];
        return matches.map(m => m.replace(/^"|"$/g, '').trim());
    };

    const results = {
        total: 0,
        success: 0,
        failed: 0,
        errors: []
    };

    // Header mapping (assuming first line is header)
    const header = parseCSVLine(lines[0]);
    results.total = lines.length - 1;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            results.total--;
            continue;
        }

        try {
            const values = parseCSVLine(line);
            // Map values to fields based on standard order or header (using simple index for now as per previous logic)
            // Name, SKU, Barcode, BasePrice, SellingPrice, Stock, Category, Status, Brand
            const [name, sku, barcode, basePrice, sellingPrice, stock, categoryName, status, brand] = values;

            if (!name) throw new Error('Product name is required');

            // Find or create category
            let categoryId;
            if (categoryName) {
                const category = await prisma.category.findFirst({
                    where: { name: { contains: categoryName, mode: 'insensitive' } }
                });
                if (category) {
                    categoryId = category.id;
                } else {
                    // Create basic category if not exists
                    const newCat = await prisma.category.create({
                        data: {
                            name: categoryName,
                            slug: slugify(categoryName, { lower: true, strict: true }) + '-' + Date.now(),
                            description: 'Auto-created during import'
                        }
                    });
                    categoryId = newCat.id;
                }
            } else {
                // Fallback to "Uncategorized" category
                const uncategorized = await prisma.category.findFirst({ where: { name: 'Uncategorized' } });
                if (uncategorized) {
                    categoryId = uncategorized.id;
                } else {
                    const newCat = await prisma.category.create({
                        data: {
                            name: 'Uncategorized',
                            slug: 'uncategorized',
                            description: 'Default category for imports'
                        }
                    });
                    categoryId = newCat.id;
                }
            }

            const product = await prisma.product.create({
                data: {
                    name,
                    slug: slugify(name, { lower: true, strict: true }) + '-' + Date.now(),
                    sku: sku || await generateSKU(name, categoryId),
                    barcode: barcode || generateBarcode(),
                    basePrice: parseFloat(basePrice) || 0,
                    sellingPrice: parseFloat(sellingPrice) || parseFloat(basePrice) || 0,
                    stock: parseInt(stock) || 0,
                    categoryId: categoryId,
                    status: (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status.toUpperCase()))
                        ? status.toUpperCase()
                        : 'DRAFT',
                    brand: brand || '',
                    description: 'Imported product'
                }
            });

            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push({ line: i + 1, error: error.message });
        }
    }

    return successResponse(res, {
        message: `Import completed: ${results.success} succeeded, ${results.failed} failed`,
        data: results
    });
});
