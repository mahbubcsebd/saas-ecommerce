const prisma = require('../config/prisma');
const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse } = require('../utils/response');
const ApiError = require('../utils/ApiError');

/**
 * Get All Languages
 */
exports.getLanguages = asyncHandler(async (req, res) => {
  const languages = await prisma.language.findMany({
    orderBy: { isDefault: 'desc' },
  });

  return successResponse(res, {
    message: 'Languages retrieved successfully',
    data: languages,
  });
});

/**
 * Get Active Languages (Public)
 */
exports.getActiveLanguages = asyncHandler(async (req, res) => {
  const languages = await prisma.language.findMany({
    where: { isActive: true },
    orderBy: { isDefault: 'desc' },
  });

  return successResponse(res, {
    message: 'Active languages retrieved successfully',
    data: languages,
  });
});

/**
 * Create Language
 */
exports.createLanguage = asyncHandler(async (req, res) => {
  const { code, name, nativeName, flag, isRtl } = req.body;

  const existingLanguage = await prisma.language.findUnique({
    where: { code },
  });

  if (existingLanguage) {
    throw ApiError.badRequest('Language with this code already exists');
  }

  const language = await prisma.language.create({
    data: {
      code,
      name,
      nativeName,
      flag,
      isRtl: isRtl || false,
    },
  });

  return successResponse(res, {
    message: 'Language created successfully',
    data: language,
  });
});

/**
 * Update Language
 */
exports.updateLanguage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, nativeName, flag, isRtl, isActive, isDefault } = req.body;

  // If setting as default, unset others
  if (isDefault) {
    await prisma.language.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false },
    });
  }

  const language = await prisma.language.update({
    where: { id },
    data: {
      name,
      nativeName,
      flag,
      isRtl,
      isActive,
      isDefault,
    },
  });

  return successResponse(res, {
    message: 'Language updated successfully',
    data: language,
  });
});

/**
 * Delete Language
 */
exports.deleteLanguage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const language = await prisma.language.findUnique({ where: { id } });

  if (language.isDefault) {
    throw ApiError.badRequest('Cannot delete the default language');
  }

  await prisma.language.delete({ where: { id } });

  return successResponse(res, {
    message: 'Language deleted successfully',
  });
});
