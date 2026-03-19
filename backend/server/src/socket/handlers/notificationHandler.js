const prisma = require('../../config/prisma');

module.exports = (io, socket) => {
  const emitCounts = async () => {
    try {
      const [totalCount, chatCount] = await Promise.all([
        // Count all unread notifications EXCLUDING 'NEW_CHAT_MESSAGE'
        prisma.notification.count({
          where: {
            userId: socket.userId,
            isRead: false,
            type: { not: 'NEW_CHAT_MESSAGE' },
          },
        }),
        // Count unread 'NEW_CHAT_MESSAGE' notifications
        prisma.notification.count({
          where: {
            userId: socket.userId,
            type: 'NEW_CHAT_MESSAGE',
            isRead: false,
          },
        }),
      ]);
      socket.emit('notification:count', { count: totalCount });
      socket.emit('notification:chat-count', { count: chatCount });
    } catch (error) {
      console.error('Emit counts error:', error);
    }
  };

  // Mark notification as read
  socket.on('notification:read', async (notificationId) => {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socket.emit('notification:read:success', { notificationId });
      await emitCounts();
    } catch (error) {
      console.error('Mark notification read error:', error);
      socket.emit('notification:read:error', { error: error.message });
    }
  });

  // Mark all as read
  socket.on('notification:read-all', async (type) => {
    try {
      const where = {
        userId: socket.userId,
        isRead: false,
      };
      if (type === 'chat') {
        where.type = 'NEW_CHAT_MESSAGE';
      }

      await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socket.emit('notification:read-all:success');
      await emitCounts();
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  });

  // Get unread count
  socket.on('notification:count', async () => {
    await emitCounts();
  });
};
