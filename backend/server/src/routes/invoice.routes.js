const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authMiddleware: protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', invoiceController.getAllInvoices);
router.post('/:id/generate', invoiceController.generateInvoiceRecord);
router.get('/:id/download', invoiceController.generateInvoice);
router.post('/:id/send-email', invoiceController.sendInvoiceEmail);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

module.exports = router;
