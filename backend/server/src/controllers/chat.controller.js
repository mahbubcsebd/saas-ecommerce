const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse: sendSuccess } = require('../utils/response');
const prisma = require('../config/prisma');
const createError = require('http-errors');

/**
 * Get user conversations
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      participantIds: {
        has: userId,
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isOnline: true,
          lastSeen: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  });

  return sendSuccess(res, {
    message: 'Conversations retrieved',
    data: conversations,
  });
});

/**
 * Get message history for a conversation
 */
exports.getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      },
      replyTo: {
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * limit,
    take: parseInt(limit),
  });

  return sendSuccess(res, {
    message: 'Messages retrieved',
    data: messages.reverse(),
  });
});

/**
 * Start or get a conversation with a participant
 */
exports.getOrCreateConversation = asyncHandler(async (req, res) => {
  let { participantId } = req.body;
  const userId = req.user.id;

  if (!participantId) {
    const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'STAFFER'];
    const staff = await prisma.user.findFirst({
      where: { role: { in: staffRoles }, NOT: { id: userId } },
      orderBy: { isOnline: 'desc' },
      select: { id: true },
    });
    if (!staff) {
      throw createError(404, 'No support staff available');
    }
    participantId = staff.id;
  }

  // Find existing conversation between these two
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participantIds: { has: userId } },
        { participantIds: { has: participantId } },
        { type: 'SUPPORT' }, // Default for now
      ],
    },
    include: {
      participants: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
        },
      },
    },
  });

  if (!conversation) {
    // Create new
    conversation = await prisma.conversation.create({
      data: {
        participantIds: [userId, participantId],
        type: 'SUPPORT',
      },
      include: {
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Update user's conversationIds (bidirectional relation in MongoDB)
    await prisma.user.updateMany({
      where: {
        id: { in: [userId, participantId] },
      },
      data: {
        conversationIds: {
          push: conversation.id,
        },
      },
    });
  }

  return sendSuccess(res, {
    message: 'Conversation ready',
    data: conversation,
  });
});
