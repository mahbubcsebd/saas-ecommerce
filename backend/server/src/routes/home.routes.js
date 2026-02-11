const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home.controller');

// Get home page sections
router.get('/sections', homeController.getHomeSections);

module.exports = router;
