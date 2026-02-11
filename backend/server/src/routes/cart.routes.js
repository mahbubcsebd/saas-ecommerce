const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Optional auth middleware (for populating req.user if present)
const optionalAuth = async (req, res, next) => {
    try {
        // Reuse auth logic but don't error if missing
        // For now, simpler to reuse authMiddleware but checking token presence manually in frontend call
        // Or specific middleware that doesn't reject:
        const authHeader = req.header('Authorization');
        if (!authHeader && !req.cookies.accessToken) {
            return next();
        }
        return authMiddleware(req, res, next);
    } catch (e) {
        next();
    }
};
// Actually the existing authMiddleware rejects if no token.
// We need a permissive one for mixed guest/auth routes if we want one route.
// Or we handle it: Frontend sends Header if logged in.

// Let's rely on standard middleware and handle guest logic in controller by checking req.user vs body.guestId
// We need a middleware that decodes token IF present, but allows if not.

const permissiveAuth = async (req, res, next) => {
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
        // If invalid token, proceed as guest (or error? better to proceed as guest often)
        next();
    }
}


router.get('/', permissiveAuth, cartController.getCart);
router.post('/add', permissiveAuth, cartController.addToCart);
router.put('/items/:id', permissiveAuth, cartController.updateCartItem);
router.delete('/items/:id', permissiveAuth, cartController.removeFromCart);

module.exports = router;
