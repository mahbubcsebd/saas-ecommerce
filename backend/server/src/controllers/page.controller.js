const prisma = require('../config/prisma');
const { successResponse } = require('../utils/response');
const slugify = require('slugify');

/**
 * Get all custom pages (supports search and publishing filters)
 */
exports.getCustomPages = async (req, res, next) => {
  try {
    const { search, status, lang = 'en' } = req.query;

    const where = {};

    // Detect optionally authenticated admin to allow viewing drafts
    let isAdminUser = false;
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = require('jsonwebtoken').verify(
          token,
          process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_KEY || 'FHDJKFHDJKSHFJKFHJKDSHF'
        );
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        if (user && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
          isAdminUser = true;
        }
      } catch (err) {
        // Ignore
      }
    }

    // Filter by status (public view only sees published)
    if (status) {
      where.published = status === 'published';
    } else if (isAdminUser) {
      // Admins see all
    } else {
      where.published = true;
    }

    if (search) {
      where.translations = {
        some: {
          langCode: lang,
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    const pages = await prisma.customPage.findMany({
      where,
      include: {
        translations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return successResponse(res, {
      message: 'Custom pages fetched successfully',
      data: pages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single custom page by slug (public)
 */
exports.getCustomPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const page = await prisma.customPage.findUnique({
      where: { slug },
      include: {
        translations: true
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Custom page not found'
      });
    }

    return successResponse(res, {
      message: 'Custom page fetched successfully',
      data: page
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single custom page by ID (for admin editing)
 */
exports.getCustomPageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await prisma.customPage.findUnique({
      where: { id },
      include: {
        translations: true
      }
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Custom page not found'
      });
    }

    return successResponse(res, {
      message: 'Custom page fetched successfully',
      data: page
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new custom page (admin protected)
 */
exports.createCustomPage = async (req, res, next) => {
  try {
    const { title, slug: customSlug, published = false, translations } = req.body;

    if (!title && (!translations || Object.keys(translations).length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Title or translations is required'
      });
    }

    // Determine default title for slug generation
    const defaultTitle = title || translations[Object.keys(translations)[0]]?.title || 'untitled-page';
    const baseSlug = customSlug || slugify(defaultTitle, { lower: true, strict: true });
    
    // Ensure slug uniqueness
    let slug = baseSlug;
    let index = 1;
    while (await prisma.customPage.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${index}`;
      index++;
    }

    const translationsData = translations || {
      en: {
        title: title || 'Untitled',
        content: req.body.content || '',
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || ''
      }
    };

    const page = await prisma.customPage.create({
      data: {
        slug,
        published,
        publishedAt: published ? new Date() : null,
        translations: {
          create: Object.entries(translationsData).map(([langCode, trans]) => ({
            langCode,
            title: trans.title || '',
            content: trans.content || '',
            metaTitle: trans.metaTitle || null,
            metaDescription: trans.metaDescription || null,
            metaKeywords: trans.metaKeywords || null
          }))
        }
      },
      include: {
        translations: true
      }
    });

    return successResponse(res, {
      message: 'Custom page created successfully',
      data: page
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing custom page (admin protected)
 */
exports.updateCustomPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slug: customSlug, published, translations } = req.body;

    const existingPage = await prisma.customPage.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return res.status(404).json({
        success: false,
        message: 'Custom page not found'
      });
    }

    const updateData = {};
    if (published !== undefined) {
      updateData.published = published;
      updateData.publishedAt = published ? (existingPage.publishedAt || new Date()) : null;
    }

    // Handle slug change
    if (customSlug && customSlug !== existingPage.slug) {
      const slugDuplicate = await prisma.customPage.findUnique({ where: { slug: customSlug } });
      if (slugDuplicate) {
        return res.status(400).json({
          success: false,
          message: 'Slug already in use'
        });
      }
      updateData.slug = customSlug;
    }

    // Perform main update
    const page = await prisma.customPage.update({
      where: { id },
      data: updateData,
      include: {
        translations: true
      }
    });

    // Upsert translations
    if (translations && Object.keys(translations).length > 0) {
      for (const [langCode, trans] of Object.entries(translations)) {
        await prisma.customPageTranslation.upsert({
          where: {
            customPageId_langCode: {
              customPageId: id,
              langCode
            }
          },
          update: {
            title: trans.title || '',
            content: trans.content || '',
            metaTitle: trans.metaTitle || null,
            metaDescription: trans.metaDescription || null,
            metaKeywords: trans.metaKeywords || null
          },
          create: {
            customPageId: id,
            langCode,
            title: trans.title || '',
            content: trans.content || '',
            metaTitle: trans.metaTitle || null,
            metaDescription: trans.metaDescription || null,
            metaKeywords: trans.metaKeywords || null
          }
        });
      }
    }

    const updatedPage = await prisma.customPage.findUnique({
      where: { id },
      include: {
        translations: true
      }
    });

    return successResponse(res, {
      message: 'Custom page updated successfully',
      data: updatedPage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a custom page (admin protected)
 */
exports.deleteCustomPage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPage = await prisma.customPage.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return res.status(404).json({
        success: false,
        message: 'Custom page not found'
      });
    }

    await prisma.customPage.delete({
      where: { id }
    });

    return successResponse(res, {
      message: 'Custom page deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
