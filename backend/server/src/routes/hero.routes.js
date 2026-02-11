const express = require('express');
const {
  getAllSlides,
  getAdminSlides,
  createSlide,
  updateSlide,
  deleteSlide,
} = require('../controllers/hero.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', getAllSlides); // Public
router.get('/admin', authMiddleware, isAdmin, getAdminSlides); // Admin

router.post('/', authMiddleware, isAdmin, createSlide);
router.put('/:id', authMiddleware, isAdmin, updateSlide);
router.delete('/:id', authMiddleware, isAdmin, deleteSlide);

module.exports = router;
