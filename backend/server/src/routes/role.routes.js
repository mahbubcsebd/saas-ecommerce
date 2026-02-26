const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// All role management is restricted to admins
router.use(authMiddleware, isAdmin);

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.patch('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
