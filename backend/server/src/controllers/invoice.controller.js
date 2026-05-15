const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');
const { errorResponse, successResponse } = require('../helpers/responseHandler');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');
const emailService = require('../services/emailService');

/**
 * Get All Invoices
 */
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    return successResponse(res, {
      data: invoices,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Invoice Record for an Order
 */
exports.generateInvoiceRecord = async (req, res, next) => {
  try {
    const { id } = req.params; // Order ID

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!order) return errorResponse(res, { statusCode: 404, message: 'Order not found' });

    let invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });

    if (invoice)
      return errorResponse(res, {
        statusCode: 400,
        message: 'Invoice already exists for this order',
      });

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' },
    });

    const nextNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1 : 1;

    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        userId: order.userId,
        amount: order.total,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days default as per terms in PDF
        status: order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
      },
    });

    return successResponse(res, {
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Generate PDF to Buffer
 */
const getPDFBuffer = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('error', (err) => {
        console.error('PDF Doc Error:', err);
        reject(err);
      });
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      generateInvoicePDF(doc, data)
        .then(() => doc.end())
        .catch((err) => {
          console.error('generateInvoicePDF Error:', err);
          reject(err);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Invoice PDF (Download)
 */
exports.generateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params; // Order ID or Invoice ID

    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: { include: { product: true, variant: true } },
        soldByUser: { select: { firstName: true, lastName: true } },
      },
    });

    // If not found by order id, try finding by invoice id
    if (!order) {
      const inv = await prisma.invoice.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: true,
              items: { include: { product: true, variant: true } },
              soldByUser: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      if (inv) order = inv.order;
    }

    if (!order) {
      return errorResponse(res, { statusCode: 404, message: 'Order/Invoice not found' });
    }

    // Get or create invoice record
    let invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });

    if (!invoice) {
      const lastInvoice = await prisma.invoice.findFirst({ orderBy: { invoiceNumber: 'desc' } });
      const nextNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1 : 1;
      const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;

      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          userId: order.userId,
          amount: order.total,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
        },
      });
    }

    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.walkInName || order.guestInfo?.name || 'Guest';

    const [companySettings, currencySettings] = await Promise.all([
      prisma.companySetting.findFirst(),
      prisma.currencySetting.findFirst(),
    ]);

    const pdfBuffer = await getPDFBuffer({ order, invoice, companySettings, currencySettings });
    const customerCleanName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Invoice_${invoice.invoiceNumber}_${customerCleanName}_${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Send Invoice via Email
 */
exports.sendInvoiceEmail = async (req, res, next) => {
  try {
    const { id } = req.params; // Invoice ID

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
            items: { include: { product: true, variant: true } },
          },
        },
        user: true,
      },
    });

    if (!invoice) return errorResponse(res, { statusCode: 404, message: 'Invoice not found' });

    const customerEmail = invoice.user?.email || invoice.order?.guestInfo?.email;
    if (!customerEmail)
      return errorResponse(res, { statusCode: 400, message: 'Customer email not found' });

    const [companySettings, currencySettings] = await Promise.all([
      prisma.companySetting.findFirst(),
      prisma.currencySetting.findFirst(),
    ]);

    // Generate PDF Buffer
    const pdfBuffer = await getPDFBuffer({
      order: invoice.order,
      invoice,
      companySettings,
      currencySettings,
    });

    const customerName = invoice.user
      ? `${invoice.user.firstName} ${invoice.user.lastName}`
      : invoice.order.walkInName || invoice.order.guestInfo?.name || 'Customer';

    await emailService.sendInvoicePdfEmail({
      to: customerEmail,
      name: customerName,
      invoiceNumber: invoice.invoiceNumber,
      pdfBuffer,
    });

    return successResponse(res, { message: 'Invoice email sent successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Invoice Status
 */
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PENDING, PAID, OVERDUE, CANCELLED

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidDate: status === 'PAID' ? new Date() : undefined,
      },
    });

    // Sync with order if status is PAID
    if (status === 'PAID') {
      await prisma.order.update({
        where: { id: invoice.orderId },
        data: { paymentStatus: 'PAID' },
      });
    }

    return successResponse(res, {
      message: 'Invoice status updated',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};
