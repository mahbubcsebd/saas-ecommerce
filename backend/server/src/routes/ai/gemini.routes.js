const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middlewares/asyncHandler');
const { authMiddleware, isAdmin } = require('../../middlewares/auth.middleware');
const { successResponse } = require('../../utils/response');
const customerAI = require('../../services/groqCustomerAI');
const dashboardAI = require('../../services/groqDashboardAI');
const prisma = require('../../config/prisma');

// ==================== CUSTOMER AI ====================

/**
 * Customer chat
 */
router.post('/customer/chat', asyncHandler(async (req, res) => {
    const { message, sessionId, language = 'en' } = req.body;
    // Optional: get userId if authenticated
    const userId = req.user?.id;

    const result = await customerAI.chat(message, sessionId, language, userId);

    return successResponse(res, {
        message: 'Response generated',
        data: result
    });
}));

/**
 * Track order
 */
router.post('/customer/track-order', asyncHandler(async (req, res) => {
    const { orderId, sessionId, language = 'en' } = req.body;

    const result = await customerAI.trackOrder(orderId, sessionId, language);

    return successResponse(res, {
        message: 'Order info retrieved',
        data: result
    });
}));

// ==================== DASHBOARD AI ====================

/**
 * Dashboard AI chat
 */
router.post('/dashboard/chat',
    authMiddleware,
    // isAdmin, // Or isManager if that exists
    asyncHandler(async (req, res) => {
        const { query, sessionId } = req.body;
        const userId = req.user.id;

        const startTime = Date.now();
        const result = await dashboardAI.chat(query, sessionId, userId);
        const executionTime = Date.now() - startTime;

        // Save query stats log if needed (AIQuery model)
        await prisma.aIQuery.create({
            data: {
                query,
                response: result.response ? JSON.parse(JSON.stringify(result.response)) : null,
                chartData: result.charts ? JSON.parse(JSON.stringify(result.charts)) : null,
                executedBy: userId,
                executionTime,
            },
        });

        return successResponse(res, {
            message: 'Analysis complete',
            data: result
        });
    })
);

/**
 * Get chat history
 */
router.get('/history/:sessionId',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const { sessionId } = req.params;
        const { type } = req.query; // 'CUSTOMER' or 'ADMIN'

        const history = await prisma.chatMessage.findMany({
            where: {
                sessionId,
                ...(type && { type: type.toUpperCase() }),
            },
            orderBy: { createdAt: 'asc' },
        });

        return successResponse(res, {
            message: 'Chat history retrieved',
            data: history
        });
    })
);

const translationService = require('../../services/translation.service');

// ... existing code ...

// ==================== TRANSLATION AI ====================

/**
 * Auto-translate text
 */
router.post('/translate',
    authMiddleware,
    asyncHandler(async (req, res) => {
        const { text, targetLangs, context } = req.body;

        const translations = await translationService.translate(text, targetLangs, context);

        return successResponse(res, {
            message: 'Translation generated',
            data: translations
        });
    })
);

module.exports = router;
