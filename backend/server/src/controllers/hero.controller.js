const { PrismaClient } = require("@prisma/client");
const createError = require("http-errors");
const prisma = new PrismaClient();

// Get all hero slides (Public)
// Query params: featured=true
exports.getAllSlides = async (req, res, next) => {
  try {
    const { featured } = req.query;
    const where = {};
    if (featured === "true") {
      where.isFeatured = true;
    }
    // Only show active slides to public unless admin?
    // Usually public endpoint should only show active.
    // But keeping it simple, maybe filter isActive=true by default for public
    where.isActive = true;

    const slides = await prisma.heroSlide.findMany({
      where,
      orderBy: { order: "asc" },
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
        orderBy: { order: "asc" },
      });

      res.status(200).json({
        success: true,
        data: slides,
      });
    } catch (error) {
      next(error);
    }
  };

// Create Slide (Admin)
exports.createSlide = async (req, res, next) => {
  try {
    const { image, title, subtitle, link, isFeatured, isActive, order } = req.body;

    const slide = await prisma.heroSlide.create({
      data: {
        image,
        title,
        subtitle,
        link,
        isFeatured: isFeatured || false,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
      },
    });

    res.status(201).json({
      success: true,
      data: slide,
    });
  } catch (error) {
    next(error);
  }
};

// Update Slide (Admin)
exports.updateSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const slide = await prisma.heroSlide.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      data: slide,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Slide (Admin)
exports.deleteSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.heroSlide.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Slide deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
