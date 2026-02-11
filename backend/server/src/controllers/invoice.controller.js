const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

/**
 * Generate Invoice PDF
 */
exports.generateInvoice = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
             include: {
                items: {
                    include: { product: true }
                },
                user: true
            }
        });

        if (!order) {
            return errorResponse(res, { statusCode: 404, message: 'Order not found' });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Stream response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Company Info (Placeholder)
        doc.fontSize(12).text('Mahbub Shop');
        doc.text('Dhaka, Bangladesh');
        doc.moveDown();

        // Order Info
        doc.text(`Order Number: ${order.orderNumber}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();

        // Customer Info
        const customerName = order.guestInfo?.name || (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest');
        doc.text(`Customer: ${customerName}`);
        doc.moveDown();

        // Table Header
        doc.text('Item', 50, 250);
        doc.text('Qty', 300, 250);
        doc.text('Price', 400, 250);
        doc.text('Total', 500, 250);
        doc.moveTo(50, 265).lineTo(550, 265).stroke();

        // Items
        let y = 280;
        order.items.forEach(item => {
            doc.text(item.name.substring(0, 30), 50, y);
            doc.text(item.quantity.toString(), 300, y);
            doc.text(item.sellingPrice.toFixed(2), 400, y);
            doc.text(item.total.toFixed(2), 500, y);
            y += 20;
        });

        doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();

        // Totals
        y += 30;
        doc.text(`Subtotal: ${order.subtotal.toFixed(2)}`, 400, y);
        y += 20;
        if (order.discountAmount > 0) {
            doc.text(`Discount: -${order.discountAmount.toFixed(2)}`, 400, y);
            y += 20;
        }
        doc.fontSize(14).text(`Total: ${order.total.toFixed(2)}`, 400, y);

        doc.end();

    } catch (error) {
        next(error);
    }
};
