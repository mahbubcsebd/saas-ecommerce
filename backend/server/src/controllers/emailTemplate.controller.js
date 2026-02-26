const createError = require("http-errors");
const prisma = require('../config/prisma');

// Get all email templates
exports.getAllEmailTemplates = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;

    const templates = await prisma.emailTemplate.findMany({
      where: filter,
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

// Get single template
exports.getEmailTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });
    if (!template) throw createError(404, "Email template not found");
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

// Create email template
exports.createEmailTemplate = async (req, res, next) => {
  try {
    const {
      name,
      subject,
      type,
      body,
      design,
      variables,
      isActive
    } = req.body;

    // Check if name already exists
    const existing = await prisma.emailTemplate.findFirst({
      where: { name }
    });

    if (existing) {
      throw createError(400, "Template name already exists");
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject: subject || "No Subject",
        type: type || null,
        body: body || "",
        design: design || {},
        variables: variables || [],
        isActive: isActive !== false
      }
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

// Update email template
exports.updateEmailTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      subject,
      type,
      body,
      design,
      variables,
      isActive
    } = req.body;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        subject,
        type,
        body,
        design,
        variables,
        isActive: isActive === undefined ? undefined : (isActive === true || isActive === 'true')
      }
    });

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

// Delete email template
exports.deleteEmailTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.emailTemplate.delete({
      where: { id }
    });
    res.status(200).json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Duplicate template
exports.duplicateEmailTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const original = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!original) throw createError(404, "Original template not found");

    const duplicate = await prisma.emailTemplate.create({
      data: {
        name: `${original.name} (Copy) - ${Date.now()}`,
        subject: original.subject,
        type: null, // Reset type for duplicate
        body: original.body,
        design: original.design,
        variables: original.variables,
        isActive: false
      }
    });

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    next(error);
  }
};
