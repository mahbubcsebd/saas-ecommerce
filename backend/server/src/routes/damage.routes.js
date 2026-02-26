const express = require('express');
const router = express.Router();
const {
    createDamageReport,
    getDamageReports,
    getDamageSummary
} = require('../controllers/damage.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.use(isManager);

router.route('/')
    .get(getDamageReports)
    .post(createDamageReport);

router.get('/summary', getDamageSummary);

module.exports = router;
