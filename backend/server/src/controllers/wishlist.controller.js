const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        return errorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
        where: {
            userId_productId: {
                userId,
                productId
            }
        }
    });

    if (existing) {
        // Remove
        await prisma.wishlist.delete({
            where: { id: existing.id }
        });
        return res.status(200).json({ success: true, message: 'Removed from wishlist', isWishlisted: false });
    } else {
        // Add
        await prisma.wishlist.create({
            data: {
                userId,
                productId
            }
        });
        return res.status(201).json({ success: true, message: 'Added to wishlist', isWishlisted: true });
    }

  } catch (error) {
    next(error);
  }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await prisma.wishlist.findMany({
        where: { userId },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    sellingPrice: true,
                    basePrice: true,
                    images: true,
                    category: true,
                    stock: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    next(error);
  }
};
