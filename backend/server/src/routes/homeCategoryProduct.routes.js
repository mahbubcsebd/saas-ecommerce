const express = require('express');
const router = express.Router();
const homeCategoryProductController = require('../controllers/homeCategoryProduct.controller');

// GET /api/homeCategoryWiseProduct
router.get('/', homeCategoryProductController.getHomeCategoryWiseProduct);

module.exports = router;
