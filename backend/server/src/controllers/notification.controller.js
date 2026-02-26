const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse: sendSuccess } = require('../utils/response');
const prisma = require('../config/prisma');
const socket = require('../socket');

/**
 * Get user notifications
 */
exports.getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (unreadOnly === 'true') {
        where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: parseInt(limit),
        }),
        prisma.notification.count({ where }),
    ]);

    return sendSuccess(res, {
        message: 'Notifications retrieved',
        data: {
            notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    });
});

/**
 * Mark notification as read
 */
exports.markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.update({
        where: { id },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });

    return sendSuccess(res, {
        message: 'Notification marked as read',
        data: notification
    });
});

/**
 * Mark all as read
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
        where: {
            userId: req.user.id,
            isRead: false
        },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });

    return sendSuccess(res, {
        message: 'All notifications marked as read'
    });
});

/**
 * Send notification (Helper to be used in other controllers)
 * @param {string} userId
 * @param {object} data { type, title, message, data }
 */
exports.sendNotification = async (userId, data) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                ...data,
                isRead: false
            }
        });

        // Emit via Socket.IO if user is online
        try {
            const io = socket.getIO();
            io.to(`user:${userId}`).emit('notification:new', notification);

            // Also update unread count
            const count = await prisma.notification.count({
                where: { userId, isRead: false }
            });
            io.to(`user:${userId}`).emit('notification:count', { count });
        } catch (ioError) {
            console.warn('Socket.IO not initialized or user offline during notification emit');
        }

        return notification;
    } catch (error) {
        console.error('Send notification error:', error);
    }
};
