const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Optional: specific middleware to extract user if logged in, but not block if not
// We can use a "tryAuth" middleware or just rely on the controller handling req.user if present
// For now, let's allow public access but use authMiddleware if we want to ensure userId is populated from token

// Route: POST /api/analytics/track
// Public access allowed (for guest tracking)
// But we might want to try extracting user from token if present
const optionalAuth = (req, res, next) => {
  // Custom logic or reuse existing middleware but handle error gracefully
  // For simplicity, let's just let the controller handle it or use existing middleware if token exists
  // If the frontend sends Authorization header, authMiddleware will popluate req.user
  next();
};

// We probably want to allow tracking without login.
// If the user sends a token, the auth middleware (if applied globally or here) should populate req.user.
// If your global middleware validates tokens strictly, we might need a permissive one.
// Let's assume we just use the controller logic to check req.user if the global app doesn't force auth on /api/analytics

router.post('/track', analyticsController.trackEvent);

// Admin Dashboard Overview Route
router.get('/overview', authMiddleware, isAdmin, analyticsController.getAdminOverview);

// Advanced Analytics Routes
router.get('/advanced', authMiddleware, isAdmin, analyticsController.getAdvancedAnalytics);
router.get('/products', authMiddleware, isAdmin, analyticsController.getProductAnalytics);
router.get('/customers', authMiddleware, isAdmin, analyticsController.getCustomerAnalytics);
router.get('/tax', authMiddleware, isAdmin, analyticsController.getTaxAnalytics);
router.get('/site', authMiddleware, isAdmin, analyticsController.getSiteAnalytics);
router.get('/export', authMiddleware, isAdmin, analyticsController.exportSalesReport);

module.exports = router;
