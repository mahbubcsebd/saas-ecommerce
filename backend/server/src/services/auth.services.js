const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const DeviceDetector = require('device-detector-js');
// const { hashRefreshToken } = require('../utils/jwt');

const hashRefreshToken = async (refreshToken) => {
  return await bcrypt.hash(refreshToken, 10);
};

/**
 * Login user by email & password
 */
exports.loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return null;

  return user;
};

/**
 * Update refresh token in DB with rotation & device info
 */
exports.updateRefreshToken = async (userId, refreshToken) => {
  const hashedRefreshToken = await hashRefreshToken(refreshToken);

  return prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: hashedRefreshToken,
      refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
};
