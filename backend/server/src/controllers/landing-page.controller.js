
const createError = require("http-errors");
const prisma = require('../config/prisma');
const slugify = require("slugify");

// --- Helper for A/B Variant Selection ---
const selectVariant = (variants) => {
  if (!variants || variants.length === 0) return null;
  const activeVariants = variants.filter(v => v.isActive);
  if (activeVariants.length === 0) return null;

  const totalWeight = activeVariants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of activeVariants) {
    if (random < variant.weight) return variant;
    random -= variant.weight;
  }
  return activeVariants[0];
};

// Create Landing Page
exports.createLandingPage = async (req, res, next) => {
  try {
    const {
      description,
      productId,
      slug,
      isAbTestActive,
      blocks,
      themeColor,
      fontFamily,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      gjs_html,
      gjs_css,
      gjs_json,
      variants // Array of { name, gjs_html, gjs_css, gjs_json, weight }
    } = req.body;

    const pageSlug = slug ? slugify(slug, { lower: true }) : slugify(title, { lower: true });

    // Check slug uniqueness
    const existing = await prisma.landingPage.findUnique({ where: { slug: pageSlug } });
    if (existing) throw createError(400, "Slug already exists");

    const page = await prisma.landingPage.create({
      data: {
        title,
        slug: pageSlug,
        description,
        productId,
        isAbTestActive: isAbTestActive === 'true' || isAbTestActive === true,
        blocks: blocks ? (typeof blocks === 'string' ? JSON.parse(blocks) : blocks) : undefined,
        themeColor: themeColor || "#3b82f6",
        fontFamily: fontFamily || "Inter",
        metaTitle,
        metaDescription,
        metaKeywords,
        ogImage,
        gjs_html,
        gjs_css,
        gjs_json,
        variants: variants ? {
          create: (typeof variants === 'string' ? JSON.parse(variants) : variants).map(v => ({
            name: v.name,
            gjs_html: v.gjs_html,
            gjs_css: v.gjs_css,
            gjs_json: v.gjs_json,
            weight: parseInt(v.weight) || 50
          }))
        } : undefined
      },
      include: { variants: true }
    });

    res.status(201).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

// Get All (Admin)
exports.getAllLandingPages = async (req, res, next) => {
  try {
    const pages = await prisma.landingPage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { variants: true } },
        product: { select: { name: true, images: true } }
      }
    });
    res.status(200).json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
};

// Get by Slug (Public Renderer)
exports.getLandingPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const page = await prisma.landingPage.findUnique({
      where: { slug },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            basePrice: true,
            sellingPrice: true,
            description: true,
            variants: true
          }
        },
        variants: { where: { isActive: true } }
      }
    });

    if (!page) throw createError(404, "Landing Page not found");
    if (!page.isActive) throw createError(403, "This page is currently inactive");

    let selectedVariant = null;
    if (page.isAbTestActive && page.variants.length > 0) {
      selectedVariant = selectVariant(page.variants);

      // Increment variant views
      if (selectedVariant) {
        prisma.landingPageVariant.update({
          where: { id: selectedVariant.id },
          data: { viewCount: { increment: 1 } }
        }).catch(console.error);
      }
    }

    // Increment page views
    prisma.landingPage.update({
      where: { id: page.id },
      data: { viewCount: { increment: 1 } }
    }).catch(console.error);

    res.status(200).json({
      success: true,
      data: {
        ...page,
        selectedVariant // Client will render this if provided
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get by ID (Admin)
exports.getLandingPageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await prisma.landingPage.findUnique({
      where: { id },
      include: { variants: true }
    });
    if (!page) throw createError(404, "Landing Page not found");
    res.status(200).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

// Update
exports.updateLandingPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      productId,
      slug,
      isAbTestActive,
      blocks,
      themeColor,
      fontFamily,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      isActive,
      gjs_html,
      gjs_css,
      gjs_json,
      variants // Array of { id, name, gjs_html, gjs_css, gjs_json, weight, isActive, shouldDelete }
    } = req.body;

    const parsedVariants = variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : [];

    // Separate variants by action
    const variantsToUpdate = parsedVariants.filter(v => v.id && !v.shouldDelete);
    const variantsToCreate = parsedVariants.filter(v => !v.id);
    const variantsToDelete = parsedVariants.filter(v => v.id && v.shouldDelete);

    const updateData = {
      title,
      description,
      productId,
      isAbTestActive: isAbTestActive === 'true' || isAbTestActive === true,
      blocks: blocks ? (typeof blocks === 'string' ? JSON.parse(blocks) : blocks) : undefined,
      themeColor,
      fontFamily,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      gjs_html,
      gjs_css,
      gjs_json,
      isActive: isActive === 'true' || isActive === true,
    };

    if (slug) updateData.slug = slugify(slug, { lower: true });

    // Use transaction for consistency
    const page = await prisma.$transaction(async (tx) => {
      // 1. Delete variants
      if (variantsToDelete.length > 0) {
        await tx.landingPageVariant.deleteMany({
          where: { id: { in: variantsToDelete.map(v => v.id) } }
        });
      }

      // 2. Update existing variants
      for (const v of variantsToUpdate) {
        await tx.landingPageVariant.update({
          where: { id: v.id },
          data: {
            name: v.name,
            gjs_html: v.gjs_html,
            gjs_css: v.gjs_css,
            gjs_json: v.gjs_json,
            weight: parseInt(v.weight) || 50,
            isActive: v.isActive !== false
          }
        });
      }

      // 3. Create new variants
      if (variantsToCreate.length > 0) {
        await tx.landingPageVariant.createMany({
          data: variantsToCreate.map(v => ({
            landingPageId: id,
            name: v.name,
            gjs_html: v.gjs_html,
            gjs_css: v.gjs_css,
            gjs_json: v.gjs_json,
            weight: parseInt(v.weight) || 50,
            isActive: v.isActive !== false
          }))
        });
      }

      // 4. Update main page
      return tx.landingPage.update({
        where: { id },
        data: updateData,
        include: { variants: true }
      });
    });

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

// Duplicate Landing Page
exports.duplicateLandingPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const original = await prisma.landingPage.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!original) throw createError(404, "Original landing page not found");

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const duplicate = await prisma.landingPage.create({
      data: {
        title: `${original.title} (Copy)`,
        slug: newSlug,
        productId: original.productId,
        gjs_html: original.gjs_html,
        gjs_css: original.gjs_css,
        gjs_json: original.gjs_json,
        isAbTestActive: original.isAbTestActive,
        themeColor: original.themeColor,
        fontFamily: original.fontFamily,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        metaKeywords: original.metaKeywords,
        ogImage: original.ogImage,
        isActive: false, // Start as draft
        variants: original.variants.length > 0 ? {
          create: original.variants.map(v => ({
            name: v.name,
            gjs_html: v.gjs_html,
            gjs_css: v.gjs_css,
            gjs_json: v.gjs_json,
            weight: v.weight,
            isActive: v.isActive
          }))
        } : undefined
      },
      include: { variants: true }
    });

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    next(error);
  }
};

// Track Conversion / Event
exports.trackConversion = async (req, res, next) => {
  try {
    const { id, variantId, event, sessionId, elementId } = req.body;

    // 1. Create granular event record
    await prisma.pageAnalytics.create({
      data: {
        pageId: id,
        sessionId: sessionId || "anonymous",
        event: event || "CONVERSION",
        elementId: elementId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }
    });

    // 2. Increment aggregated counts
    if (event === "VIEW") {
      await prisma.landingPage.update({
        where: { id },
        data: { viewCount: { increment: 1 } }
      });
      if (variantId) {
        await prisma.landingPageVariant.update({
          where: { id: variantId },
          data: { viewCount: { increment: 1 } }
        });
      }
    } else if (event === "CONVERSION" || event === "SUBMIT") {
      await prisma.landingPage.update({
        where: { id },
        data: { orderCount: { increment: 1 } }
      });
      if (variantId) {
        await prisma.landingPageVariant.update({
          where: { id: variantId },
          data: { orderCount: { increment: 1 } }
        });
      }
    }

    res.status(200).json({ success: true, message: "Event tracked" });
  } catch (error) {
    next(error);
  }
};

// Get Analytics
exports.getLandingPageAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await prisma.landingPage.findUnique({
      where: { id },
      include: { variants: true }
    });

    if (!page) throw createError(404, "Landing Page not found");

    const totalEvents = await prisma.pageAnalytics.count({ where: { pageId: id } });

    // Group events by type
    const eventCounts = await prisma.pageAnalytics.groupBy({
      by: ['event'],
      where: { pageId: id },
      _count: true
    });

    const conversionRate = page.viewCount > 0 ? (page.orderCount / page.viewCount) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        page,
        totalEvents,
        eventCounts,
        conversionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete
exports.deleteLandingPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.landingPage.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};
