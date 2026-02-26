const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const orderController = require('../controllers/order.controller');
const { authMiddleware, isStaff } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const {
    createOrderValidation,
    updateOrderStatusValidation,
    orderIdValidation,
    orderQueryValidation
} = require('../validators/orderValidator');

const permissiveAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.accessToken;

        if (token) {
             const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_KEY || 'FHDJKFHDJKSHFJKFHJKDSHF';
             const decoded = jwt.verify(token, secret);
             req.user = { id: decoded.userId, role: decoded.role };
        }
        next();
    } catch (e) {
        next();
    }
}

// ============================================
// PUBLIC / USER ROUTES
// ============================================
router.post('/', permissiveAuthMiddleware, createOrderValidation, validate, orderController.createOrder); // Auth optional (Guest/User)
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.get('/:id', permissiveAuthMiddleware, orderIdValidation, validate, orderController.getOrder); // Shared (User/Admin/Guest with correct ID?)

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/admin/all', authMiddleware, isStaff, orderQueryValidation, validate, orderController.getAllOrders);
router.patch('/admin/bulk-status', authMiddleware, isStaff, orderController.bulkUpdateStatus);
router.patch('/admin/:id/status', authMiddleware, isStaff, updateOrderStatusValidation, validate, orderController.updateOrderStatus);
router.patch('/admin/:id/payment-status', authMiddleware, isStaff, validate, orderController.updatePaymentStatus);

module.exports = router;
