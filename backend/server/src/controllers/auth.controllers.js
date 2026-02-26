const crypto = require('crypto'); // Added crypto
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const { updateRefreshToken } = require('../services/auth.services');
require('dotenv').config();
const { excludeFields } = require('../utils/exclude');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse, createdResponse } = require('../utils/response');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService'); // Added email service
const NotificationService = require('../services/notification.service');
const StaffService = require('../services/staff.service');

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_ACCESS_KEY ||
      'FHDJKFHDJKSHFJKFHJKDSHF',
    { expiresIn: '24h' },
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'JGFJKGKJDGSJKFGISDGFGFUIGi',
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;
  const requireEmailVerification =
    process.env.ENFORCE_EMAIL_VERIFICATION === 'true';

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingEmail) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Check if username already exists (case-insensitive)
  const normalizedUsername = username.trim().toLowerCase();
  const existingUsername = await prisma.user.findFirst({
    where: {
      OR: [{ username: username.trim() }, { username: normalizedUsername }],
    },
  });
  if (existingUsername) {
    throw ApiError.conflict('This username is already taken');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationTokenExpiry = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ); // 24 hours

  // Default avatar
  const defaultAvatar = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;

  const userData = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    username: normalizedUsername,
  };

  let newUser;
  if (requireEmailVerification) {
    newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        avatar: defaultAvatar,
        status: 'PENDING', // Pending verification
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationTokenExpiry,
        isActive: false, // Inactive until verified
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Make sure this is standard
    const verificationLink = `${frontendUrl}/verify-email?token=${emailVerificationToken}`;

    try {
      await sendVerificationEmail({
        to: newUser.email,
        name: newUser.firstName,
        verificationLink,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Note: User is created but email failed. They might need a "resend verify email" endpoint.
    }

    return createdResponse(res, {
      message:
        'Registration successful! Please check your email to verify your account.',
      data: newUser,
    });
  } else {
    // Create active & verified user (dev-friendly or if verification disabled)
    const created = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        avatar: defaultAvatar,
        status: 'ACTIVE',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
        isActive: true,
      },
    });

    // Send Welcome Notification
    await NotificationService.notifyUser(
        created.id,
        'WELCOME',
        'Welcome to Mahbub Shop!',
        'Thank you for joining us. We are excited to have you on board.',
        { url: '/profile' }
    );

    // Generate tokens for immediate login
    const { accessToken, refreshToken } = generateTokens(created.id);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Set access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    await updateRefreshToken(created.id, refreshToken, req);

    return createdResponse(res, {
      message: 'Registration successful!',
      data: {
        user: {
          id: created.id,
          firstName: created.firstName,
          lastName: created.lastName,
          email: created.email,
          role: created.role,
          avatar: created.avatar,
          isEmailVerified: created.isEmailVerified,
        },
        accessToken,
        expiresIn: 24 * 60 * 60,
      },
    });
  }
});

/**
 * Verify email
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body; // Or req.params if GET, but typically POST for verification action

  if (!token) {
    throw ApiError.badRequest('Verification token is missing');
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  // Activate user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: 'ACTIVE',
      isActive: true, // Legacy support
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    },
  });

  // Generate tokens for immediate login
  const { accessToken, refreshToken } = generateTokens(updatedUser.id);

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  await updateRefreshToken(updatedUser.id, refreshToken, req);

  return successResponse(res, {
    message: 'Email verified successfully!',
    data: {
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        isEmailVerified: updatedUser.isEmailVerified,
      },
      accessToken,
      expiresIn: 24 * 60 * 60,
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email, username (case-insensitive), or phone
  const loginId = email.trim();
  const loginIdLower = loginId.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginIdLower },
        { username: loginId },
        { username: loginIdLower },
        { phone: loginId },
      ],
    },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Check password
  if (!user.password) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(password, user.password || '');
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  // Check email verification (conditional)
  const enforceVerify = process.env.ENFORCE_EMAIL_VERIFICATION === 'true';
  if (enforceVerify && !user.isEmailVerified) {
    throw ApiError.unauthorized('Please verify your email address to log in');
  }
  // If not enforcing verification, auto-activate user if needed
  if (!enforceVerify) {
    if (
      !user.isEmailVerified ||
      user.status !== 'ACTIVE' ||
      user.isActive === false
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
          isActive: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        },
      });
      // refresh user object in memory with minimal fields
      user.isEmailVerified = true;
    }
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token in DB
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  // Use excludeFields utility but specify as array of keys
  const safeUser = excludeFields(user, ['password', 'refreshToken']);

  // Send Login Notification (Non-blocking)
  setImmediate(() => {
    NotificationService.notifyUser(
      user.id,
      'LOGIN_NEW_DEVICE', // Simplified: treating all logins as potentially new for now or just identifying it
      'New Login Detected',
      `Login from ${req.headers['user-agent'] || 'Unknown Device'}`,
      { time: new Date() }
    ).catch(err => console.error('Login notification error:', err));

    // Also notify admins if it's a staff member login
    if (['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user.role)) {
       NotificationService.notifyAdmins(
         'STAFF_LOGIN',
         'Staff Login',
         `${user.firstName} ${user.lastName} logged in.`,
         { userId: user.id, role: user.role }
       ).catch(err => console.error('Staff login notify error:', err));
    }

    // Global Activity Logging
    StaffService.logActivity({
       userId: user.id,
       action: 'LOGIN',
       target: 'System: Auth Session',
       metadata: {
           method: 'CREDENTIALS',
           device: req.headers['user-agent'],
           ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
       },
       ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
       userAgent: req.headers['user-agent']
    }).catch(err => console.error('Activity log error:', err));
  });

  return successResponse(res, {
    message: `Welcome back, ${user.firstName}!`,
    data: {
      user: safeUser,
      accessToken,
      expiresIn: 24 * 60 * 60, // 24 hours
    },
  });
});

// Logout API
exports.logout = asyncHandler(async (req, res) => {
  // Auth middleware provided userId, but can logout without it
  const { id: userId } = req.user || {}; // Map id to userId for existing logic

  if (userId) {
    // Clear refresh token from database
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        // lastLogoutAt: new Date(),
      },
    });

    // Global Activity Logging
    StaffService.logActivity({
       userId: userId,
       action: 'LOGOUT',
       target: 'System: Auth Session',
       metadata: { device: req.headers['user-agent'] },
       ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
       userAgent: req.headers['user-agent']
    }).catch(err => console.error('Activity log error:', err));
  }

  // Clear refresh token cookie (always do this)
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // For development
    path: '/',
  });

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  return successResponse(res, {
    message: 'You have been successfully logged out. See you next time!',
  });
});

// Refresh Token API
exports.refreshToken = asyncHandler(async (req, res) => {
  // Priority: HTTP-only cookie > Request body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw ApiError.unauthorized('Session expired. Please log in again.');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'JGFJKGKJDGSJKFGISDGFGFUIGi',
    );
  } catch (err) {
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    throw ApiError.unauthorized(
      'Your session has expired. Please log in again.',
    );
  }

  // Find user and validate refresh token
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    throw ApiError.unauthorized('User account not found. Please log in again.');
  }

  // Validate stored refresh token
  if (user.refreshToken !== refreshToken) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    throw ApiError.unauthorized(
      'Invalid session. Please log in again for security.',
    );
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    user.id,
  );

  // Update refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: newRefreshToken,
      // lastActiveAt: new Date(),
    },
  });

  // Set new refresh token as HTTP-only cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  // Set new access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });

  const safeUser = excludeFields(user, ['password', 'refreshToken']);

  return successResponse(res, {
    message: 'Session refreshed successfully',
    data: {
      user: safeUser,
      accessToken,
      expiresIn: 24 * 60 * 60,
    },
  });
});

// Get user profile (protected route)
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id; // From auth middleware

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      username: true,
      phone: true,
      address: true,
      avatar: true,
      role: true,
      bio: true,
      website: true,
      dob: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User profile not found');
  }

  return successResponse(res, {
    message: 'Profile retrieved successfully',
    data: {
      user: {
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
      },
    },
  });
});

/**
 * Verify invitation token
 */
exports.verifyInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await prisma.user.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      invitationExpiry: true,
      status: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('Invalid invitation link');
  }

  if (user.status === 'ACTIVE' && !user.invitationToken) {
    throw ApiError.badRequest('This invitation has already been used');
  }

  if (new Date() > user.invitationExpiry) {
    throw ApiError.badRequest('Invitation link has expired');
  }

  return successResponse(res, {
    message: 'Invitation is valid',
    data: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

/**
 * Setup password (complete registration)
 */
exports.setupPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Validate password
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }

  const user = await prisma.user.findUnique({
    where: { invitationToken: token },
  });

  if (!user) {
    throw ApiError.notFound('Invalid invitation link');
  }

  if (new Date() > user.invitationExpiry) {
    throw ApiError.badRequest('Invitation link has expired');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      status: 'ACTIVE',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      invitationToken: null,
      invitationExpiry: null,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  });

  return successResponse(res, {
    message: 'Password set successfully. You can now login.',
    data: updatedUser,
  });
});

/**
 * Request password reset
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw ApiError.badRequest('Email is required');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase().trim() },
        { username: email.toLowerCase().trim() },
        { phone: email.trim() },
      ],
    },
    select: { id: true, email: true, firstName: true },
  });

  if (!user) {
    // Do not reveal existence; return success message
    return successResponse(res, {
      message:
        'If your email exists in our system, you will receive a password reset link shortly.',
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.firstName || 'there',
      resetLink,
    });
  } catch (e) {
    console.error('Failed to send password reset email:', e);
    // Still respond success to avoid email enumeration
  }

  return successResponse(res, {
    message:
      'If your email exists in our system, you will receive a password reset link shortly.',
  });
});

/**
 * Reset password
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw ApiError.badRequest('Token and new password are required');
  }
  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      // If user was pending verification but requested reset, do not auto-verify email
    },
  });

  return successResponse(res, {
    message:
      'Password has been reset successfully. You can now login with your new password.',
  });
});
