const crypto = require('crypto');
const prisma = require('../../config/prisma');
const { successResponse, errorResponse } = require('../../utils/response');
const { sendInvitationEmail } = require('../../services/emailService');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../middlewares/asyncHandler');

/**
 * Admin creates new user
 */
exports.createUser = asyncHandler(async (req, res) => {
  const { email, phone, firstName, lastName, role, username, isActive, customRoleId } = req.body;
  const adminId = req.user.id; // From auth middleware
  const currentUserRole = req.user.role;

  // Hierarchy Check during creation
  if (currentUserRole !== 'SUPER_ADMIN') {
    const sensitiveRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (sensitiveRoles.includes(role)) {
      throw ApiError.forbidden(`You cannot create a user with role ${role}`);
    }
  }

  // Check for duplicates specifically
  const emailExists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (emailExists) {
    throw ApiError.conflict('Email already exists');
  }

  if (username) {
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      throw ApiError.conflict('Username already exists');
    }
  }

  if (phone) {
    const phoneExists = await prisma.user.findFirst({ where: { phone } });
    if (phoneExists) {
      throw ApiError.conflict('Phone number already exists');
    }
  }

  // Generate invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create user without password
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      phone,
      firstName,
      lastName,
      username: username || email.split('@')[0] + Math.floor(Math.random() * 1000), // Use provided username or generate temporary one
      password: crypto.randomBytes(16).toString('hex'), // Temporary random password
      role: role || 'CUSTOMER',
      customRoleId: customRoleId && customRoleId !== 'NONE' ? customRoleId : null,
      status: isActive === false ? 'INACTIVE' : 'PENDING', // If explicitly set to false, inactive. Else pending invitation.
      isActive: isActive !== undefined ? isActive : true,
      invitationToken,
      invitationSentAt: new Date(),
      invitationExpiry,
      createdBy: adminId,
      isEmailVerified: false,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      invitationSentAt: true,
      isActive: true, // Select isActive
    },
  });

  // Send invitation email
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const invitationLink = `${frontendUrl}/auth/setup-password?token=${invitationToken}`;

  try {
    await sendInvitationEmail({
      to: email,
      name: `${firstName} ${lastName}`,
      invitationLink,
      expiryDays: 7,
    });
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError);
  }

  return successResponse(res, {
    statusCode: 201,
    message: 'User created and invitation sent successfully',
    data: user,
  });
});

/**
 * Resend invitation
 */
exports.resendInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.status === 'ACTIVE' && user.password && !user.invitationToken) {
    throw ApiError.badRequest('User is already active and set up');
  }

  // Generate new invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id },
    data: {
      invitationToken,
      invitationSentAt: new Date(),
      invitationExpiry,
      status: 'PENDING',
    },
  });

  // Send invitation email
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const invitationLink = `${frontendUrl}/auth/setup-password?token=${invitationToken}`;

  await sendInvitationEmail({
    to: user.email,
    name: `${user.firstName} ${user.lastName}`,
    invitationLink,
    expiryDays: 7,
  });

  return successResponse(res, {
    message: 'Invitation resent successfully',
  });
});
