const translationService = require('../services/translation.service');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../config/prisma');

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
      orderBy: { isDefault: 'desc' },
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
      data: { code, name, nativeName, flag, isRtl },
    });

    // Trigger auto-translation in background
    translationService.autoTranslateLanguage(code).catch(console.error);

    res.status(201).json({
      success: true,
      data: language,
      message: 'Language added. Auto-translation started.',
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
        langCode_namespace_key: { langCode, namespace, key },
      },
      update: { value, isReviewed: true },
      create: { langCode, namespace, key, value, isReviewed: true },
    });

    res.status(200).json({ success: true, data: translation });
  } catch (error) {
    next(error);
  }
};
// Get version/timestamp of translations for caching
exports.getVersions = async (req, res, next) => {
  try {
    // Find the most recent update time for each language
    const versions = await prisma.uiTranslation.groupBy({
      by: ['langCode'],
      _max: {
        updatedAt: true,
      },
    });

    const versionMap = {};
    versions.forEach((v) => {
      versionMap[v.langCode] = v._max.updatedAt.getTime();
    });

    res.status(200).json({ success: true, data: versionMap });
  } catch (error) {
    next(error);
  }
};

// Admin: Add a new key and auto-translate
exports.addKey = async (req, res, next) => {
  try {
    const { namespace, key, value } = req.body;
    await translationService.addKey(namespace, key, value);
    res.status(201).json({ success: true, message: 'Key added and auto-translated.' });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete a key from all languages
exports.deleteKey = async (req, res, next) => {
  try {
    const { namespace, key } = req.body;
    await translationService.deleteKey(namespace, key);
    res.status(200).json({ success: true, message: 'Key deleted from all languages.' });
  } catch (error) {
    next(error);
  }
};

// Admin: Rename a key
exports.renameKey = async (req, res, next) => {
  try {
    const { namespace, oldKey, newKey } = req.body;
    await translationService.renameKey(namespace, oldKey, newKey);
    res.status(200).json({ success: true, message: 'Key renamed across all languages.' });
  } catch (error) {
    next(error);
  }
};

// Admin: Translate a single key (missing languages only)
exports.translateSingleKey = async (req, res) => {
  try {
    const { namespace, key, force } = req.body;
    const result = await translationService.translateSingleKey(namespace, key, force);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetNamespace = async (req, res) => {
  try {
    const { namespace } = req.body;
    const result = await translationService.resetNamespaceTranslations(namespace);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Bulk auto-translate missing keys in a namespace
exports.bulkAutoTranslate = async (req, res, next) => {
  try {
    const { namespace } = req.body;

    let results;
    if (!namespace || namespace === 'all') {
      const namespaces = await prisma.translationNamespace.findMany();
      results = { updated: 0, errors: [] };
      for (const ns of namespaces) {
        const nsResult = await translationService.translateMissingKeys(ns.name);
        results.updated += nsResult.updated;
        results.errors.push(...nsResult.errors);
      }
    } else {
      results = await translationService.translateMissingKeys(namespace);
    }

    res.status(200).json({
      success: true,
      message: `Bulk translation completed. ${results.updated} values updated.`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
// Namespace Management
exports.getNamespaces = async (req, res, next) => {
  try {
    const namespaces = await prisma.translationNamespace.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: namespaces });
  } catch (error) {
    next(error);
  }
};

exports.addNamespace = async (req, res, next) => {
  try {
    const { name } = req.body;
    const namespace = await prisma.translationNamespace.create({
      data: { name },
    });
    res.status(201).json({ success: true, data: namespace });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Namespace already exists' });
    }
    next(error);
  }
};

exports.deleteNamespace = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.translationNamespace.delete({
      where: { id },
    });
    res.status(200).json({ success: true, message: 'Namespace deleted' });
  } catch (error) {
    next(error);
  }
};

exports.updateNamespace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const oldNamespace = await prisma.translationNamespace.findUnique({
      where: { id },
    });

    if (!oldNamespace) {
      return res.status(404).json({ success: false, message: 'Namespace not found' });
    }

    // Update the namespace name
    const updated = await prisma.translationNamespace.update({
      where: { id },
      data: { name },
    });

    // Cascade update to all keys using the old namespace
    if (oldNamespace.name !== name) {
      await prisma.uiTranslation.updateMany({
        where: { namespace: oldNamespace.name },
        data: { namespace: name },
      });
    }

    res
      .status(200)
      .json({ success: true, data: updated, message: 'Namespace updated and keys synced.' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Namespace name already exists' });
    }
    next(error);
  }
};
