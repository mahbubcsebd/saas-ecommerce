const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');
const { authenticate, isStaff, isAdmin } = require('../middlewares/auth.middleware');

// Public endpoints
router.get('/', blogController.getBlogPosts);
router.get('/:slug', blogController.getBlogPostBySlug);

// Admin-specific editing endpoint (requires Staff or above)
router.get('/id/:id', authenticate, isStaff, blogController.getBlogPostById);

// Admin endpoints
router.post('/', authenticate, isAdmin, blogController.createBlogPost);
router.put('/:id', authenticate, isAdmin, blogController.updateBlogPost);
router.delete('/:id', authenticate, isAdmin, blogController.deleteBlogPost);

module.exports = router;
