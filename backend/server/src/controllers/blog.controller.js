const prisma = require('../config/prisma');
const { successResponse } = require('../utils/response');
const slugify = require('slugify');

/**
 * Get all blog posts (supports pagination, search, publishing status, and language filters)
 */
exports.getBlogPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, tag, status, lang = 'en' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build Prisma query condition
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

    // Filter by status (public view only sees PUBLISHED by default, admin can filter)
    if (status) {
      where.published = status === 'published';
    } else if (isAdminUser) {
      // Admins see all by default unless filtered
    } else {
      where.published = true; // Public sees only published
    }

    // Filter by tag
    if (tag) {
      where.tags = { has: tag };
    }

    // Search inside translations
    if (search) {
      where.translations = {
        some: {
          langCode: lang,
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    // Fetch total count and posts concurrently
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        include: {
          translations: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take
      })
    ]);

    return successResponse(res, {
      message: 'Blog posts fetched successfully',
      data: {
        posts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single blog post by slug (public/admin)
 */
exports.getBlogPostBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        translations: true
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    return successResponse(res, {
      message: 'Blog post fetched successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single blog post by ID (for admin editing)
 */
exports.getBlogPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    return successResponse(res, {
      message: 'Blog post fetched successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new blog post (admin protected)
 */
exports.createBlogPost = async (req, res, next) => {
  try {
    const { title, featuredImage, published = false, tags = [], translations } = req.body;

    if (!title && (!translations || Object.keys(translations).length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Title or translations is required'
      });
    }

    // Determine default title for slug generation
    const defaultTitle = title || translations[Object.keys(translations)[0]]?.title || 'untitled-post';
    const baseSlug = slugify(defaultTitle, { lower: true, strict: true });
    
    // Ensure slug uniqueness
    let slug = baseSlug;
    let index = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${index}`;
      index++;
    }

    // Assemble nested translations structure
    const translationsData = translations || {
      en: {
        title: title || 'Untitled',
        content: req.body.content || '',
        excerpt: req.body.excerpt || '',
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        metaKeywords: req.body.metaKeywords || ''
      }
    };

    const post = await prisma.blogPost.create({
      data: {
        slug,
        featuredImage: featuredImage || null,
        published,
        publishedAt: published ? new Date() : null,
        tags: Array.isArray(tags) ? tags : [],
        translations: {
          create: Object.entries(translationsData).map(([langCode, trans]) => ({
            langCode,
            title: trans.title || '',
            content: trans.content || '',
            excerpt: trans.excerpt || null,
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
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing blog post (admin protected)
 */
exports.updateBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slug: customSlug, featuredImage, published, tags, translations } = req.body;

    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const updateData = {};
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (published !== undefined) {
      updateData.published = published;
      updateData.publishedAt = published ? (existingPost.publishedAt || new Date()) : null;
    }
    if (tags !== undefined) updateData.tags = tags;

    // Handle slug change if provided and unique
    if (customSlug && customSlug !== existingPost.slug) {
      const slugDuplicate = await prisma.blogPost.findUnique({ where: { slug: customSlug } });
      if (slugDuplicate) {
        return res.status(400).json({
          success: false,
          message: 'Slug already in use'
        });
      }
      updateData.slug = customSlug;
    }

    // Perform main update
    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        translations: true
      }
    });

    // Upsert translations
    if (translations && Object.keys(translations).length > 0) {
      for (const [langCode, trans] of Object.entries(translations)) {
        await prisma.blogPostTranslation.upsert({
          where: {
            blogPostId_langCode: {
              blogPostId: id,
              langCode
            }
          },
          update: {
            title: trans.title || '',
            content: trans.content || '',
            excerpt: trans.excerpt || null,
            metaTitle: trans.metaTitle || null,
            metaDescription: trans.metaDescription || null,
            metaKeywords: trans.metaKeywords || null
          },
          create: {
            blogPostId: id,
            langCode,
            title: trans.title || '',
            content: trans.content || '',
            excerpt: trans.excerpt || null,
            metaTitle: trans.metaTitle || null,
            metaDescription: trans.metaDescription || null,
            metaKeywords: trans.metaKeywords || null
          }
        });
      }
    }

    // Refetch the complete post with updated translations
    const updatedPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        translations: true
      }
    });

    return successResponse(res, {
      message: 'Blog post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a blog post (admin protected)
 */
exports.deleteBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Delete post (relations cascade on DB level if configured, but Prisma cascade delete is guaranteed here since relation has onDelete: Cascade)
    await prisma.blogPost.delete({
      where: { id }
    });

    return successResponse(res, {
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
