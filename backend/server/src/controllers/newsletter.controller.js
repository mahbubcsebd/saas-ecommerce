const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createdResponse } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middlewares/asyncHandler');

exports.subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    throw ApiError.badRequest('Please provide a valid email address');
  }

  // Check if already subscribed
  const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existingSubscriber) {
    // If already exists but inactive, reactivate
    if (!existingSubscriber.isActive) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true },
      });
      return createdResponse(res, { message: 'Successfully resubscribed to the newsletter!' });
    }
    // Already active
    return res.status(200).json({ success: true, message: 'You are already subscribed!' });
  }

  // Check if they are a registered user to link the account
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  await prisma.newsletterSubscriber.create({
    data: {
      email,
      userId: existingUser ? existingUser.id : undefined,
      isActive: true,
    },
  });

  return createdResponse(res, { message: 'Successfully subscribed to the newsletter!' });
});
