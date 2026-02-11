const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return errorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: parseInt(rating),
        comment,
      },
    });

    // Update product rating stats
    // Improved avg calculation could be done here or via aggregation
    const reviews = await prisma.review.findMany({ where: { productId } });
    const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = totalRating / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        numReviews: reviews.length,
        rating: avgRating,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
            select: { firstName: true, lastName: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};
