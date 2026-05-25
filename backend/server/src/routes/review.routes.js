const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getAllReviews,
  updateReviewStatus,
  replyToReview,
  deleteReview,
  createCustomReview,
} = require('../controllers/review.controller');
const { authMiddleware: protect, isManager } = require('../middlewares/auth.middleware');
const { anyImageUpload } = require('../middlewares/upload.middleware');

// Public / Customer Routes
router.post('/', protect, anyImageUpload('reviews'), createReview);
router.get('/:productId', getProductReviews);

// Admin Routes
router.get('/admin/all', protect, isManager, getAllReviews);
router.post('/admin/custom', protect, isManager, createCustomReview);
router.put('/admin/:id/status', protect, isManager, updateReviewStatus);
router.put('/admin/:id/reply', protect, isManager, replyToReview);
router.delete('/admin/:id', protect, isManager, deleteReview);

module.exports = router;
