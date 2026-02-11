const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');
const { permissiveAuth } = require('./cart.routes'); // Reuse permissive auth helper?
// Actually let's redefine permissiveAuth here or move it to a shared middleware file.
// For now, implementing permissive logic inline or importing if I extracted it.
// To avoid "cannot find module cart.routes", I'll just check conditions.

const permissiveAuthMiddleware = async (req, res, next) => {
    try {
         const authHeader = req.header('Authorization');
         const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.accessToken;

         if (token) {
             const jwt = require('jsonwebtoken');
             const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'FHDJKFHDJKSHFJKFHJKDSHF');
             req.user = { id: decoded.userId };
         }
         next();
    } catch (e) {
        next();
    }
}

// Public/Guest/Auth
router.post('/', permissiveAuthMiddleware, orderController.createOrder);

// Auth Only
router.get('/my-orders', authMiddleware, orderController.getMyOrders);

// Admin Only
router.get('/admin/all', authMiddleware, isAdmin, orderController.getAllOrders);
router.put('/admin/:id/status', authMiddleware, isAdmin, orderController.updateOrderStatus);

// Public/Shared - Get Single Order
router.get('/:id', orderController.getOrder);

module.exports = router;
