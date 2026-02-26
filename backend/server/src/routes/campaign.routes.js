const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// Public tracking endpoint (no auth needed)
router.get('/track/open/:recipientId', campaignController.trackOpen);

// Admin/Manager protected routes
router.use(authMiddleware, isManager);

router.post('/', campaignController.createCampaign);
router.get('/', campaignController.getAllCampaigns);
router.get('/recipients', campaignController.getRecipients);
router.post('/send-quick', campaignController.sendQuickEmail);
router.get('/:id', campaignController.getCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);
router.post('/:id/send', campaignController.sendCampaign);

module.exports = router;
