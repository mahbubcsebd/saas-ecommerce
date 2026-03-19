const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const {
  addToCartValidation,
  updateCartItemValidation,
  cartItemIdValidation,
  cartQueryValidation,
} = require('../validators/cartValidator');

const permissiveAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.accessToken;

    if (token) {
      const jwt = require('jsonwebtoken');
      const secret =
        process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_KEY || 'FHDJKFHDJKSHFJKFHJKDSHF';
      try {
        const decoded = jwt.verify(token, secret);
        req.user = { id: decoded.userId };
      } catch (err) {
        // Token invalid, treat as guest
      }
    }
    next();
  } catch (e) {
    next();
  }
};

router.get('/', permissiveAuth, cartQueryValidation, validate, cartController.getCart);
router.post('/add', permissiveAuth, addToCartValidation, validate, cartController.addToCart);
router.post('/merge', permissiveAuth, cartController.mergeCart);
router.put(
  '/items/:id',
  permissiveAuth,
  updateCartItemValidation,
  validate,
  cartController.updateCartItem
);
router.delete(
  '/items/:id',
  permissiveAuth,
  cartItemIdValidation,
  validate,
  cartController.removeFromCart
);
router.delete('/', permissiveAuth, cartController.clearCart);

module.exports = router;
