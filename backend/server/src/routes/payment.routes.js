const express = require('express');
const { authMiddleware, hasPermission } = require('../middlewares/auth.middleware');
const { addOrderPayment, getOrderPayments } = require('../controllers/payment.controller');

const router = express.Router();

// All payment routes require auth and MANAGE_ORDERS permission
router.use(authMiddleware, hasPermission('MANAGE_ORDERS'));

router.route('/order/:orderId')
  .post(addOrderPayment)
  .get(getOrderPayments);

module.exports = router;
