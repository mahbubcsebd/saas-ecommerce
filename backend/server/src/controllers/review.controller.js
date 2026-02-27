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

    // Extract uploaded images
    const images = req.files ? req.files.map(file => file.path) : [];

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: parseInt(rating),
        comment,
        images,
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
      where: { productId, status: 'APPROVED' }, // Only show approved reviews to public
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

// ==========================================
// ADMIN METHODS
// ==========================================

// Get all reviews with pagination, filtering, and search
exports.getAllReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, rating, search } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    if (search) {
      whereClause.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          product: { select: { id: true, name: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update review status (Approve, Reject)
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isFlagged } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (typeof isFlagged === 'boolean') updateData.isFlagged = isFlagged;

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    // Re-calculate product ratings if status changes to or from APPROVED
    if (status) {
        const productReviews = await prisma.review.findMany({
            where: { productId: review.productId, status: 'APPROVED' },
        });

        const numReviews = productReviews.length;
        const avgRating = numReviews > 0
            ? productReviews.reduce((acc, curr) => acc + curr.rating, 0) / numReviews
            : 0;

        await prisma.product.update({
            where: { id: review.productId },
            data: { numReviews, rating: avgRating },
        });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Reply to a review
exports.replyToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: { adminReply },
    });

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Delete a review
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
        return errorResponse(res, { statusCode: 404, message: 'Review not found' });
    }

    await prisma.review.delete({ where: { id } });

    // Re-calculate product ratings
    const productReviews = await prisma.review.findMany({
        where: { productId: review.productId, status: 'APPROVED' },
    });

    const numReviews = productReviews.length;
    const avgRating = numReviews > 0
        ? productReviews.reduce((acc, curr) => acc + curr.rating, 0) / numReviews
        : 0;

    await prisma.product.update({
        where: { id: review.productId },
        data: { numReviews, rating: avgRating },
    });

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
