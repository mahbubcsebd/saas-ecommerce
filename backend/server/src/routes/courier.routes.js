const express = require('express');
const router = express.Router();
const courierController = require('../controllers/courier.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Admin Only
router.get('/', authenticate, isAdmin, courierController.getAllCouriers);
router.get('/:id', authenticate, isAdmin, courierController.getCourierById);
router.post('/', authenticate, isAdmin, courierController.createCourier);
router.put('/:id', authenticate, isAdmin, courierController.updateCourier);
router.delete('/:id', authenticate, isAdmin, courierController.deleteCourier);

module.exports = router;
