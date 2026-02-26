const express = require('express');
const router = express.Router();
const returnController = require('../controllers/return.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// Root routes
router.route('/')
  .post(authMiddleware, returnController.createReturn) // Any logged in user
  .get(authMiddleware, returnController.getAllReturns); // Anyone can get their own, Admin gets all

// ID specific routes
router.route('/:id')
  .get(authMiddleware, returnController.getReturnById);

router.route('/:id/status')
  .patch(authMiddleware, isManager, returnController.updateReturnStatus);

module.exports = router;
