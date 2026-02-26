const prisma = require('../config/prisma');
const socket = require('../socket');

class NotificationService {
    /**
     * Get IO instance safely
     */
    static getIO() {
        try {
            return socket.getIO();
        } catch (error) {
            console.warn('Socket.IO not initialized');
            return null;
        }
    }

    /**
     * Notify a specific user (Customer or Staff)
     * @param {string} userId - The recipient's ID
     * @param {string} type - NotificationType enum
     * @param {string} title - Title of notification
     * @param {string} message - Message body
     * @param {object} data - Extra data (e.g., { orderId: '...' })
     */
    static async notifyUser(userId, type, title, message, data = {}) {
        try {
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    type,
                    title,
                    message,
                    data,
                    isRead: false
                }
            });

            const io = this.getIO();
            if (io) {
                // Emit real-time notification
                io.to(`user:${userId}`).emit('notification:new', notification);

                // Update counts
                await this.emitCounts(userId);
            }

            return notification;
        } catch (error) {
            console.error(`Failed to notify user ${userId}:`, error);
        }
    }

    /**
     * Notify all admins and staff with specific roles
     * @param {string} type - NotificationType enum
     * @param {string} title - Title
     * @param {string} message - Message
     * @param {object} data - Extra data
     * @param {string[]} roles - Array of roles to notify (default: ADMIN, SUPER_ADMIN, MANAGER)
     */
    static async notifyAdmins(type, title, message, data = {}, roles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER']) {
        try {
            // Find all users with the specified roles
            const staffUsers = await prisma.user.findMany({
                where: {
                    role: { in: roles },
                    isActive: true, // Only notify active staff
                    status: 'ACTIVE'
                },
                select: { id: true }
            });

            if (staffUsers.length === 0) return;

            // Use notifyUser for each admin to ensure socket emission (notification:new)
            // and consistent behavior (toast detection)
            for (const user of staffUsers) {
                await this.notifyUser(user.id, type, title, message, data);
            }

            // Also broadcast for any listeners on role rooms (if needed for other dashboards)
            const io = this.getIO();
            if (io) {
                 roles.forEach(role => {
                    io.to(`role:${role}`).emit('notification:broadcast', { type, title, message, data });
                });
            }

        } catch (error) {
            console.error('Failed to notify admins:', error);
        }
    }

    /**
     * Update and emit notification counts for a user
     * Separates Chat vs System notifications
     */
    static async emitCounts(userId) {
        try {
            const io = this.getIO();
            if (!io) return;

            const [totalCount, chatCount] = await Promise.all([
                // Count all unread notifications EXCLUDING 'NEW_MESSAGE'
                prisma.notification.count({
                    where: {
                        userId,
                        isRead: false,
                        type: { not: 'NEW_MESSAGE' } // Exclude chat
                    }
                }),
                // Count unread 'NEW_MESSAGE' notifications
                prisma.notification.count({
                    where: {
                        userId,
                        isRead: false,
                        type: 'NEW_MESSAGE'
                    }
                })
            ]);

            io.to(`user:${userId}`).emit('notification:count', { count: totalCount });
            io.to(`user:${userId}`).emit('notification:chat-count', { count: chatCount });
        } catch (error) {
            console.error('Emit counts error:', error);
        }
    }
}

module.exports = NotificationService;
