const express = require('express');
const router = express.Router();
const purchaseReturnController = require('../controllers/purchaseReturn.controller');
const { authMiddleware: protect, isAdmin } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(isAdmin);

router.route('/')
    .get(purchaseReturnController.getPurchaseReturns)
    .post(purchaseReturnController.createPurchaseReturn);

router.route('/:id')
    .get(purchaseReturnController.getPurchaseReturn);

module.exports = router;
