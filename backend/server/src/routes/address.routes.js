const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware); // All address routes require auth

router.post('/', addressController.createAddress);
router.get('/', addressController.getMyAddresses);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
