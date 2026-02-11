const translationService = require('../services/translation.service');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get translations for a specific language
exports.getTranslations = async (req, res, next) => {
  try {
    const { langCode } = req.params;
    const translations = await translationService.getTranslations(langCode);

    // Cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    res.status(200).json({ success: true, data: translations });
  } catch (error) {
    next(error);
  }
};

// Get all supported languages
exports.getLanguages = async (req, res, next) => {
  try {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      orderBy: { isDefault: 'desc' }
    });
    res.status(200).json({ success: true, data: languages });
  } catch (error) {
    next(error);
  }
};

// Admin: Add new language
exports.addLanguage = async (req, res, next) => {
  try {
    const { code, name, nativeName, flag, isRtl } = req.body;

    const language = await prisma.language.create({
      data: { code, name, nativeName, flag, isRtl }
    });

    // Trigger auto-translation in background
    translationService.autoTranslateLanguage(code).catch(console.error);

    res.status(201).json({
        success: true,
        data: language,
        message: 'Language added. Auto-translation started.'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Manual update/add translation
exports.updateTranslation = async (req, res, next) => {
  try {
    const { langCode, namespace, key, value } = req.body;

    const translation = await prisma.uiTranslation.upsert({
      where: {
        langCode_namespace_key: { langCode, namespace, key }
      },
      update: { value, isReviewed: true },
      create: { langCode, namespace, key, value, isReviewed: true }
    });

    res.status(200).json({ success: true, data: translation });
  } catch (error) {
    next(error);
  }
};
