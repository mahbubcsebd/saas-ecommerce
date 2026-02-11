const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authMiddleware: protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/:id/download', invoiceController.generateInvoice);

module.exports = router;
