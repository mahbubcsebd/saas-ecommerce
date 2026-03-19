const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  colors: {
    primary: '#000000', // Black
    secondary: '#000000', // Black
    text: '#000000', // Black
    lightText: '#000000', // Black
    border: '#000000', // Black
    background: '#f3f4f6', // Light Gray for headers/zebra (optional, keeping subtle)
    white: '#ffffff',
  },
  fonts: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
  },
  layout: {
    margin: 50,
    pageSize: 'A4',
  },
  company: {
    defaultName: 'Mahbub Shop',
    defaultAddress: '123 eCommerce St, Dhaka, Bangladesh',
    defaultPhone: '+880 1234 567890',
    defaultEmail: 'support@mahbubshop.com',
    defaultWebsite: 'www.mahbubshop.com',
    defaultVat: 'BIN-123456789',
  },
};

/**
 * Generate Invoice PDF Content
 * @param {PDFDocument} doc
 * @param {Object} data - { order, invoice, companySettings, currencySettings }
 */
const generateInvoicePDF = (doc, data) => {
  const { order, invoice, companySettings, currencySettings } = data;
  const { colors, fonts, layout, company } = config;

  // Helper: Format Currency
  const formatCurrency = (amount) => {
    const symbol = currencySettings?.symbol || '৳';
    const position = currencySettings?.symbolPosition || 'LEFT';
    const formatted = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return position === 'RIGHT' ? `${formatted} ${symbol}` : `${symbol} ${formatted}`;
  };

  // Helper: Draw Line
  const drawLine = (y) => {
    doc
      .moveTo(layout.margin, y)
      .lineTo(doc.page.width - layout.margin, y)
      .strokeColor(colors.border)
      .lineWidth(0.5)
      .stroke();
  };

  let y = layout.margin;

  // ==================== HEADER ====================
  // Left: Company Info
  doc
    .fontSize(20)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text(companySettings?.name || company.defaultName, layout.margin, y);

  y += 25;
  doc.fontSize(10).font(fonts.regular).fillColor(colors.secondary); // Increased from 9 for readability

  const address = companySettings?.address || company.defaultAddress;
  const phone = companySettings?.phone || company.defaultPhone;
  const email = companySettings?.email || company.defaultEmail;
  const website = 'www.mahbubshop.com'; // Hardcoded for now based on request

  doc.text(address, layout.margin, y);
  y += 14;
  doc.text(`Phone: ${phone}`, layout.margin, y);
  y += 14;
  doc.text(`Email: ${email}`, layout.margin, y);
  y += 14;
  doc.text(`Web: ${website}`, layout.margin, y);

  // Right: Invoice Meta
  // "INVOICE" Title
  doc
    .fontSize(24)
    .font(fonts.bold)
    .fillColor(colors.primary) // Very light gray like frontend
    .text('INVOICE', 0, layout.margin, { align: 'right', width: doc.page.width - layout.margin });

  // Meta Details
  let metaY = layout.margin + 35;
  const metaX = 400; // Starting X for meta values

  doc.fontSize(10).font(fonts.regular).fillColor(colors.text);

  // Invoice #
  doc
    .font(fonts.bold)
    .text(`#${invoice.invoiceNumber}`, 0, metaY, {
      align: 'right',
      width: doc.page.width - layout.margin,
    });
  metaY += 16; /* Increased line height */

  // Date
  doc
    .font(fonts.regular)
    .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 0, metaY, {
      align: 'right',
      width: doc.page.width - layout.margin,
    });
  metaY += 16;

  // Status
  doc.text(`Status: ${order.paymentStatus}`, 0, metaY, {
    align: 'right',
    width: doc.page.width - layout.margin,
  });

  // Header Border
  y = Math.max(y, metaY) + 20;
  drawLine(y);
  y += 20;

  // ==================== ADDRESSES ====================
  const col2X = 300;

  // Bill To
  doc.fontSize(9).font(fonts.bold).fillColor(colors.text).text('BILL TO', layout.margin, y);
  // doc.text('SHIP TO', col2X, y); // Handled later for alignment

  y += 20;

  // Bill To Content
  doc.fontSize(11).font(fonts.bold).fillColor(colors.text);
  const customerName = order.user
    ? `${order.user.firstName} ${order.user.lastName}`
    : order.walkInName || order.guestInfo?.name || 'Guest';
  doc.text(customerName, layout.margin, y);
  y += 16;

  doc.fontSize(10).font(fonts.regular).fillColor(colors.text);
  const customerEmail = order.user?.email || order.guestInfo?.email;
  const customerPhone = order.user?.phone || order.guestInfo?.phone;

  if (customerEmail) {
    doc.text(customerEmail, layout.margin, y);
    y += 14;
  }
  if (customerPhone) {
    doc.text(customerPhone, layout.margin, y);
  }

  // Ship To Header (Aligned with Bill To)
  const sectionTopY = y - (16 + 14 * ((customerEmail ? 1 : 0) + (customerPhone ? 1 : 0))) - 20; // Back to 'BILL TO' line
  doc.fontSize(9).font(fonts.bold).fillColor(colors.text).text('SHIP TO', col2X, sectionTopY);

  let shipY = sectionTopY + 20;
  doc.fontSize(11).font(fonts.bold).fillColor(colors.text);
  const shipName = order.shippingAddress?.name || customerName;
  doc.text(shipName, col2X, shipY);
  shipY += 16;

  doc.fontSize(10).font(fonts.regular).fillColor(colors.text);
  if (order.shippingAddress) {
    const addr = order.shippingAddress;
    doc.text(addr.addressLine1 || addr.address || '', col2X, shipY);
    shipY += 14;
    doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`, col2X, shipY);
    shipY += 14;
    doc.text(addr.country || 'Bangladesh', col2X, shipY);
    shipY += 14;
    if (addr.phone) doc.text(addr.phone, col2X, shipY);
  } else {
    doc.text('Same as billing address', col2X, shipY);
  }

  y = Math.max(y, shipY) + 30;

  // ==================== ITEMS TABLE ====================

  // Headers
  const tableTop = y;
  doc.rect(layout.margin, tableTop, doc.page.width - layout.margin * 2, 25).fill(colors.background);

  doc.fillColor(colors.text).fontSize(9).font(fonts.bold);
  const colQty = 320;
  const colPrice = 380;
  const colTotal = 470;

  doc.text('ITEM DESCRIPTION', layout.margin + 10, tableTop + 8);
  doc.text('QTY', colQty, tableTop + 8, { width: 50, align: 'center' });
  doc.text('UNIT PRICE', colPrice, tableTop + 8, { width: 70, align: 'right' });
  doc.text('AMOUNT', colTotal, tableTop + 8, { width: 70, align: 'right' });

  y += 25;

  // Rows
  doc.font(fonts.regular).fillColor(colors.text);

  order.items.forEach((item, i) => {
    const productName = item.name;
    const variantName = item.variant?.name ? `(${item.variant.name})` : '';
    const sku = item.sku ? `SKU: ${item.sku}` : '';

    // Calculate height needed
    // Assuming ~15 per line. Name could be multiline.
    // For simplicity, we use fixed or slightly logic.
    // Let's use a safe row height.
    let rowHeight = 35;
    if (variantName) rowHeight += 12;
    if (sku) rowHeight += 12;

    // Check page break BEFORE printing
    if (y + rowHeight > doc.page.height - 150) {
      // Reserve 150 for Footer area to be safe
      doc.addPage();
      y = 50;
      // Reprint Header? Optional.
    }

    // Zebra striping (very subtle)
    // if (i % 2 === 1) doc.rect(layout.margin, y, doc.page.width - 2 * layout.margin, rowHeight).fill(colors.background);

    doc.fillColor(colors.text);

    // Name
    doc
      .fontSize(10)
      .font(fonts.bold)
      .text(productName, layout.margin + 10, y + 8, { width: 250 });
    let textY = y + 20;

    if (variantName) {
      doc
        .fontSize(9)
        .font(fonts.regular)
        .text(variantName, layout.margin + 10, textY);
      textY += 12;
    }
    if (sku) {
      doc
        .fontSize(8)
        .font(fonts.regular)
        .text(sku, layout.margin + 10, textY);
    }

    doc
      .fontSize(10)
      .font(fonts.regular)
      .text(item.quantity.toString(), colQty, y + 12, { width: 50, align: 'center' });

    const price = item.salePrice || item.price || item.unitPrice || 0;
    doc.text(formatCurrency(price), colPrice, y + 12, { width: 70, align: 'right' });

    const total = price * item.quantity;
    doc
      .font(fonts.bold)
      .text(formatCurrency(total), colTotal, y + 12, { width: 70, align: 'right' });

    y += rowHeight;

    // Line
    doc
      .moveTo(layout.margin, y)
      .lineTo(doc.page.width - layout.margin, y)
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .stroke();
  });

  // ==================== TOTALS ====================
  // Ensure space for totals (approx 100px) + Footer (150px)
  if (y > doc.page.height - 250) {
    doc.addPage();
    y = 50;
  }

  y += 20;
  const totalsWidth = 300;
  const totalsStart = doc.page.width - layout.margin - totalsWidth;

  const drawTotalRow = (label, value, isBold = false, isGrand = false) => {
    doc
      .fontSize(isGrand ? 12 : 10)
      .font(isBold ? fonts.bold : fonts.regular)
      .fillColor(colors.text);
    doc.text(label, totalsStart, y, { width: 150, align: 'left' });
    doc.text(formatCurrency(value), totalsStart + 150, y, { width: 150, align: 'right' });
    y += isGrand ? 25 : 18;
  };

  drawTotalRow('Subtotal', order.subtotal);
  if (order.discountAmount > 0) {
    drawTotalRow('Discount', order.discountAmount);
  }
  drawTotalRow('Shipping', order.shippingCost);

  if (order.tax > 0 || order.vatAmount > 0) {
    drawTotalRow('Tax/VAT', order.tax || order.vatAmount);
  }

  y += 5;
  doc
    .moveTo(totalsStart, y)
    .lineTo(doc.page.width - layout.margin, y)
    .strokeColor(colors.border)
    .stroke();
  y += 10;

  drawTotalRow('Total', order.total, true, true);

  // ==================== FOOTER ====================
  // Move slightly higher to safeguard against margins
  const footerY = doc.page.height - 130;

  // Terms (Left)
  doc
    .fontSize(8)
    .font(fonts.bold)
    .fillColor(colors.text)
    .text('TERMS & CONDITIONS', layout.margin, footerY);
  doc
    .fontSize(8)
    .font(fonts.regular)
    .text(
      'Payment is due within 15 days. Please check the goods upon delivery. Returns accepted within 7 days with original receipt.',
      layout.margin,
      footerY + 15,
      { width: 250 }
    );

  // Signatory (Right)
  const sigX = doc.page.width - layout.margin - 150;
  const sigLineY = footerY + 30;
  doc
    .moveTo(sigX, sigLineY)
    .lineTo(doc.page.width - layout.margin, sigLineY)
    .strokeColor(colors.border)
    .stroke();
  doc
    .fontSize(8)
    .font(fonts.bold)
    .text('Authorized Signatory', sigX, sigLineY + 5, { width: 150, align: 'center' });

  // Thank You - Moved up to - doc.page.height - 80 (Well within margin)
  const bottomTextY = doc.page.height - 80;
  doc
    .fontSize(9)
    .font(fonts.regular)
    .fillColor(colors.text)
    .text('Thank you for your business!', layout.margin, bottomTextY, {
      align: 'center',
      width: doc.page.width - layout.margin * 2,
    });
};

module.exports = { generateInvoicePDF };
