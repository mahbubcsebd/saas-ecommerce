const express = require('express');
const router = express.Router();
const abandonedCartController = require('../controllers/abandonedCart.controller');
const { authMiddleware, isStaff } = require('../middlewares/auth.middleware');

// All abandoned cart routes are protected and restricted to staff or above
router.use(authMiddleware);
router.use(isStaff);

router.get('/', abandonedCartController.getAllAbandonedCarts);
router.get('/:id', abandonedCartController.getAbandonedCartById);
router.post('/:id/send-recovery', abandonedCartController.sendRecoveryEmail);

module.exports = router;
