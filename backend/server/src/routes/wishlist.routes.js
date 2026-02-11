const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlist.controller');
const { authMiddleware: protect } = require('../middlewares/auth.middleware');

router.post('/toggle', protect, toggleWishlist);
router.get('/', protect, getWishlist);

module.exports = router;
