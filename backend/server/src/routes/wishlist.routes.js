const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlist.controller');
const { getWishlistAnalytics } = require('../controllers/wishlist-admin.controller');
const { authMiddleware: protect, isManager } = require('../middlewares/auth.middleware');

// Admin analytics endpoint — must be before customer routes
router.get('/admin/analytics', protect, isManager, getWishlistAnalytics);

router.post('/toggle', protect, toggleWishlist);
router.get('/', protect, getWishlist);

module.exports = router;
