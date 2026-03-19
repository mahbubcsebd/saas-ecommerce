const { PrismaClient } = require('@prisma/client');
const createError = require('http-errors');
const prisma = require('../config/prisma');
const contentTranslationService = require('../services/contentTranslation.service');

// Get all hero slides (Public)
exports.getAllSlides = async (req, res, next) => {
  try {
    const now = new Date();

    const slides = await prisma.heroSlide.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
        ],
      },
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: slides,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all slides (including inactive)
exports.getAdminSlides = async (req, res, next) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: slides,
    });
  } catch (error) {
    next(error);
  }
};

// Create Slide (Admin) - Now handles multiple image uploads
exports.createSlide = async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
      });
    }

    // Parse metadata from request body
    // Metadata can be sent as JSON string or individual fields
    let metadata = {};
    if (req.body.metadata) {
      metadata = JSON.parse(req.body.metadata);
    }

    // Get the current max order to append new slides at the end
    const maxOrderSlide = await prisma.heroSlide.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const startOrder = maxOrderSlide ? maxOrderSlide.order + 1 : 0;

    // Create slides for each uploaded image
    const slides = await Promise.all(
      req.files.map((file, index) => {
        // Get metadata for this specific image if provided as array
        const slideMetadata = Array.isArray(metadata) ? metadata[index] || {} : metadata;

        return prisma.heroSlide.create({
          data: {
            image: file.path,
            title: slideMetadata.title || req.body.title || '',
            subtitle: slideMetadata.subtitle || req.body.subtitle || '',
            linkType: slideMetadata.linkType || req.body.linkType || 'NONE',
            linkValue: slideMetadata.linkValue || req.body.linkValue || '',
            isActive:
              slideMetadata.isActive !== undefined
                ? slideMetadata.isActive
                : req.body.isActive !== 'false' && req.body.isActive !== false,
            order: startOrder + index,
            startDate: slideMetadata.startDate
              ? new Date(slideMetadata.startDate)
              : req.body.startDate
                ? new Date(req.body.startDate)
                : null,
            endDate: slideMetadata.endDate
              ? new Date(slideMetadata.endDate)
              : req.body.endDate
                ? new Date(req.body.endDate)
                : null,
          },
        });
      })
    );

    res.status(201).json({
      success: true,
      data: slides,
      message: `${slides.length} slide(s) created successfully`,
    });

    // Trigger background auto-translation
    slides.forEach((slide) => {
      if (slide.title || slide.subtitle) {
        contentTranslationService.autoTranslateHeroSlideForAll(slide.id).catch(console.error);
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update Slide (Admin)
exports.updateSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, linkType, linkValue, isActive, order, startDate, endDate } = req.body;

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        title,
        subtitle,
        linkType,
        linkValue,
        isActive:
          isActive !== undefined
            ? typeof isActive === 'string'
              ? isActive === 'true'
              : isActive
            : undefined,
        order: order !== undefined ? parseInt(order) : undefined,
        startDate: startDate ? new Date(startDate) : startDate === null ? null : undefined,
        endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
      },
    });

    res.status(200).json({
      success: true,
      data: slide,
    });

    // Trigger background auto-translation if content changed
    if (title !== undefined || subtitle !== undefined) {
      contentTranslationService.autoTranslateHeroSlideForAll(slide.id, true).catch(console.error);
    }
  } catch (error) {
    next(error);
  }
};

// Delete Slide (Admin)
exports.deleteSlide = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the slide to extract image URL
    const slide = await prisma.heroSlide.findUnique({
      where: { id },
    });

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found',
      });
    }

    // Delete from Cloudinary
    if (slide.image) {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary.utils');
      await deleteImageFromCloudinary(slide.image);
    }

    // Delete from database
    await prisma.heroSlide.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Slide deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update Multiple Slide Orders (Admin)
exports.updateSlideOrders = async (req, res, next) => {
  try {
    const { slides } = req.body; // [{ id, order }, ...]

    if (!Array.isArray(slides)) {
      return res.status(400).json({
        success: false,
        message: 'slides must be an array',
      });
    }

    // Update all slides in parallel
    const updates = slides.map((slide) =>
      prisma.heroSlide.update({
        where: { id: slide.id },
        data: { order: slide.order },
      })
    );

    await Promise.all(updates);

    // Return updated slides
    const updatedSlides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: updatedSlides,
    });
  } catch (error) {
    next(error);
  }
};
