const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller');
const { authenticate, isStaff, isAdmin } = require('../middlewares/auth.middleware');

// Public endpoints
router.get('/', pageController.getCustomPages);
router.get('/:slug', pageController.getCustomPageBySlug);

// Admin-specific editing endpoint (requires Staff or above)
router.get('/id/:id', authenticate, isStaff, pageController.getCustomPageById);

// Admin endpoints
router.post('/', authenticate, isAdmin, pageController.createCustomPage);
router.put('/:id', authenticate, isAdmin, pageController.updateCustomPage);
router.delete('/:id', authenticate, isAdmin, pageController.deleteCustomPage);

module.exports = router;
