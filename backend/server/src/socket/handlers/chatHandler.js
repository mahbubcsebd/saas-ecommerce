const prisma = require('../../config/prisma');

module.exports = (io, socket) => {
  // Helper to emit counts
  const emitCounts = async (userId) => {
    try {
      const [totalCount, chatCount] = await Promise.all([
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
        prisma.notification.count({
          where: { userId, type: 'NEW_MESSAGE', isRead: false },
        }),
      ]);
      io.to(`user:${userId}`).emit('notification:count', { count: totalCount });
      io.to(`user:${userId}`).emit('notification:chat-count', { count: chatCount });
    } catch (error) {
      console.error('Emit counts error:', error);
    }
  };

  // Join conversation room
  socket.on('chat:join', async (conversationId) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            select: { id: true },
          },
        },
      });

      if (!conversation) {
        return socket.emit('chat:error', { message: 'Conversation not found' });
      }

      const isParticipant = conversation.participants.some((p) => p.id === socket.userId);
      if (!isParticipant) {
        return socket.emit('chat:error', { message: 'Access denied' });
      }

      socket.join(`conversation:${conversationId}`);
      socket.emit('chat:joined', { conversationId });
    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('chat:error', { message: error.message });
    }
  });

  // Leave conversation
  socket.on('chat:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    socket.emit('chat:left', { conversationId });
  });

  // Send message (Updated for Reply and Type)
  socket.on('chat:message', async (data) => {
    try {
      const { conversationId, message, attachments = [], type = 'TEXT', replyToId = null } = data;

      const newMessage = await prisma.chatMessage.create({
        data: {
          conversationId,
          senderId: socket.userId,
          message,
          attachments,
          type,
          replyToId,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
          },
          replyTo: {
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: type === 'TEXT' ? message : `[${type}]`,
          lastMessageAt: new Date(),
        },
        include: {
          participants: {
            select: { id: true },
          },
        },
      });

      // Emit to conversation room (real-time chat window)
      io.to(`conversation:${conversationId}`).emit('chat:message:new', newMessage);

      // Emit to each participant's individual user room (for sidebar/notifications)
      for (const participant of conversation.participants) {
        io.to(`user:${participant.id}`).emit('chat:message:new', newMessage);

        if (participant.id !== socket.userId) {
          // Create persistent notification
          await prisma.notification.create({
            data: {
              userId: participant.id,
              type: 'NEW_MESSAGE',
              title: 'New Message',
              message: `${socket.user.firstName} sent you a ${type === 'TEXT' ? 'message' : type.toLowerCase()}`,
              data: { conversationId },
            },
          });
          await emitCounts(participant.id);
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('chat:error', { message: error.message });
    }
  });

  // Edit message
  socket.on('chat:edit', async (data) => {
    try {
      const { messageId, message } = data;
      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId, senderId: socket.userId },
        data: {
          message,
          isEdited: true,
          updatedAt: new Date(),
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      });
      io.to(`conversation:${updatedMessage.conversationId}`).emit(
        'chat:message:updated',
        updatedMessage
      );
    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('chat:error', { message: 'Failed to edit message' });
    }
  });

  // Delete message (Soft delete)
  socket.on('chat:delete', async (messageId) => {
    try {
      const deletedMessage = await prisma.chatMessage.update({
        where: { id: messageId, senderId: socket.userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          message: 'This message was deleted',
        },
      });
      io.to(`conversation:${deletedMessage.conversationId}`).emit('chat:message:deleted', {
        messageId,
      });
    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit('chat:error', { message: 'Failed to delete message' });
    }
  });

  // React to message
  socket.on('chat:react', async (data) => {
    try {
      const { messageId, emoji } = data;
      const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
      if (!msg) return;

      let reactions = msg.reactions || [];
      if (!Array.isArray(reactions)) reactions = [];

      const reactionIndex = reactions.findIndex((r) => r.emoji === emoji);

      if (reactionIndex > -1) {
        // Toggle user reaction
        const userIndex = reactions[reactionIndex].userIds.indexOf(socket.userId);
        if (userIndex > -1) {
          reactions[reactionIndex].userIds.splice(userIndex, 1);
          if (reactions[reactionIndex].userIds.length === 0) {
            reactions.splice(reactionIndex, 1);
          }
        } else {
          reactions[reactionIndex].userIds.push(socket.userId);
        }
      } else {
        reactions.push({ emoji, userIds: [socket.userId] });
      }

      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { reactions },
      });

      io.to(`conversation:${updatedMessage.conversationId}`).emit('chat:message:reacted', {
        messageId,
        reactions: updatedMessage.reactions,
      });
    } catch (error) {
      console.error('Reaction error:', error);
    }
  });

  // Mark as read
  socket.on('chat:read', async ({ conversationId, messageId }) => {
    try {
      await prisma.chatMessage.updateMany({
        where: { conversationId, id: messageId, senderId: { not: socket.userId } },
        data: { isRead: true, readAt: new Date() },
      });
      io.to(`conversation:${conversationId}`).emit('chat:read', {
        messageId,
        userId: socket.userId,
      });
      await emitCounts(socket.userId);
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
};
