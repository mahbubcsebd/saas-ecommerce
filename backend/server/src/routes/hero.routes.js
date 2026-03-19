const express = require('express');
const {
  getAllSlides,
  getAdminSlides,
  createSlide,
  updateSlide,
  deleteSlide,
  updateSlideOrders,
} = require('../controllers/hero.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');
const { multipleImageUpload } = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/', getAllSlides); // Public
router.get('/admin', authMiddleware, isAdmin, getAdminSlides); // Admin

router.post(
  '/',
  authMiddleware,
  isAdmin,
  multipleImageUpload('ecommerce/hero', 'images', 10),
  createSlide
);
router.put('/:id', authMiddleware, isAdmin, updateSlide);
router.patch('/reorder', authMiddleware, isAdmin, updateSlideOrders);
router.delete('/:id', authMiddleware, isAdmin, deleteSlide);

module.exports = router;
