const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase.controller');
const { authMiddleware: protect, isAdmin } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(isAdmin);

router.route('/')
    .get(purchaseController.getPurchases)
    .post(purchaseController.createPurchase);

router.route('/:id')
    .get(purchaseController.getPurchase);

module.exports = router;
