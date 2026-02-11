const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/review.controller');
const { authMiddleware: protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createReview);
router.get('/:productId', getProductReviews);

module.exports = router;
