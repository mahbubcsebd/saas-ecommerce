const axios = require('axios');

// Helper: Fetch image as buffer
const fetchImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error(`Failed to fetch image: ${url}`, error.message);
    return null;
  }
};

// Configuration
const config = {
  colors: {
    primary: '#000000',
    secondary: '#333333',
    text: '#000000',
    lightText: '#666666',
    border: '#e5e7eb',
    background: '#f3f4f6',
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
const generateInvoicePDF = async (doc, data) => {
  const { order, invoice, companySettings, currencySettings } = data;
  const { colors, fonts, layout, company } = config;

  // Helper: Format Currency
  const formatCurrency = (amount) => {
    let symbol = currencySettings?.symbol || 'Tk';
    // Replace Taka symbol with Tk if it's the unsupported Unicode char
    if (symbol === '৳') symbol = 'Tk';
    
    const position = currencySettings?.symbolPosition || 'LEFT';
    const formatted = Number(amount || 0).toLocaleString('en-US', {
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
  doc.fontSize(10).font(fonts.regular).fillColor(colors.secondary);

  const address = companySettings?.address || company.defaultAddress;
  const phone = companySettings?.phone || company.defaultPhone;
  const email = companySettings?.email || company.defaultEmail;
  const website = companySettings?.website || company.defaultWebsite;

  doc.text(address, layout.margin, y);
  y += 14;
  doc.text(`Phone: ${phone}`, layout.margin, y);
  y += 14;
  doc.text(`Email: ${email}`, layout.margin, y);
  y += 14;
  doc.text(`Web: ${website}`, layout.margin, y);

  // Right: Invoice Meta
  doc
    .fontSize(24)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text('INVOICE', 0, layout.margin, { align: 'right', width: doc.page.width - layout.margin });

  let metaY = layout.margin + 35;
  doc.fontSize(10).font(fonts.regular).fillColor(colors.text);

  doc
    .font(fonts.bold)
    .text(`#${invoice.invoiceNumber}`, 0, metaY, {
      align: 'right',
      width: doc.page.width - layout.margin,
    });
  metaY += 16;

  doc
    .font(fonts.regular)
    .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 0, metaY, {
      align: 'right',
      width: doc.page.width - layout.margin,
    });
  metaY += 16;

  doc.text(`Status: ${order.paymentStatus}`, 0, metaY, {
    align: 'right',
    width: doc.page.width - layout.margin,
  });

  y = Math.max(y, metaY) + 20;
  drawLine(y);
  y += 20;

  // ==================== ADDRESSES ====================
  const col2X = 300;
  doc.fontSize(9).font(fonts.bold).fillColor(colors.text).text('BILL TO', layout.margin, y);
  
  const sectionTopY = y;
  doc.text('SHIP TO', col2X, sectionTopY);

  y += 20;
  doc.fontSize(11).font(fonts.bold).fillColor(colors.text);
  const customerName = order.user
    ? `${order.user.firstName} ${order.user.lastName}`
    : order.walkInName || order.guestInfo?.name || 'Guest';
  doc.text(customerName, layout.margin, y);
  
  let shipY = y;
  const shipName = order.shippingAddress?.name || customerName;
  doc.text(shipName, col2X, shipY);
  
  y += 16;
  shipY += 16;

  doc.fontSize(10).font(fonts.regular).fillColor(colors.text);
  const customerEmail = order.user?.email || order.guestInfo?.email;
  const customerPhone = order.user?.phone || order.guestInfo?.phone || order.walkInPhone;

  if (customerEmail) {
    doc.text(customerEmail, layout.margin, y);
    y += 14;
  }
  if (customerPhone) {
    doc.text(customerPhone, layout.margin, y);
    y += 14;
  }

  if (order.shippingAddress) {
    const addr = order.shippingAddress;
    doc.text(addr.addressLine1 || addr.street || addr.address || '', col2X, shipY);
    shipY += 14;
    doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`, col2X, shipY);
    shipY += 14;
    doc.text(addr.country || 'Bangladesh', col2X, shipY);
  } else {
    doc.text('Same as billing address', col2X, shipY);
  }

  y = Math.max(y, shipY) + 30;

  // ==================== ITEMS TABLE ====================
  const tableTop = y;
  doc.rect(layout.margin, tableTop, doc.page.width - layout.margin * 2, 25).fill(colors.background);

  doc.fillColor(colors.text).fontSize(9).font(fonts.bold);
  const colImg = layout.margin + 10;
  const colDesc = layout.margin + 50;
  const colQty = 320;
  const colPrice = 380;
  const colTotal = 470;

  doc.text('ITEM DESCRIPTION', colDesc, tableTop + 8);
  doc.text('QTY', colQty, tableTop + 8, { width: 50, align: 'center' });
  doc.text('UNIT PRICE', colPrice, tableTop + 8, { width: 70, align: 'right' });
  doc.text('AMOUNT', colTotal, tableTop + 8, { width: 70, align: 'right' });

  y += 25;
  doc.font(fonts.regular).fillColor(colors.text);

  for (const item of order.items) {
    const productName = item.productName || item.name || item.product?.name || 'Product';
    const variantName = item.variant?.name ? `(${item.variant.name})` : '';
    const sku = item.sku || item.product?.sku ? `SKU: ${item.sku || item.product?.sku}` : '';
    const imageUrl = item.product?.images?.[0];

    let rowHeight = 45;
    if (y + rowHeight > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    doc.fillColor(colors.text);

    // Image Rendering
    if (imageUrl) {
      const imgBuffer = await fetchImage(imageUrl);
      if (imgBuffer) {
        try {
          doc.image(imgBuffer, colImg, y + 5, { width: 30, height: 30 });
        } catch (e) {
          console.error('Pdfkit image error:', e.message);
        }
      }
    } else {
      // Placeholder for no image
      doc.rect(colImg, y + 5, 30, 30).strokeColor('#ccc').stroke();
    }

    // Name & Details
    doc.fontSize(10).font(fonts.bold).text(productName, colDesc, y + 5, { width: 200 });
    let textY = y + 17;
    if (variantName) {
      doc.fontSize(8).font(fonts.regular).fillColor('#666').text(variantName, colDesc, textY);
      textY += 10;
    }
    if (sku) {
      doc.fontSize(7).font(fonts.regular).fillColor('#999').text(sku, colDesc, textY);
    }

    doc.fontSize(10).font(fonts.regular).fillColor(colors.text);
    doc.text(item.quantity.toString(), colQty, y + 12, { width: 50, align: 'center' });

    const price = item.salePrice || item.price || item.unitPrice || 0;
    doc.text(formatCurrency(price), colPrice, y + 12, { width: 70, align: 'right' });

    const itemTotal = price * item.quantity;
    doc.font(fonts.bold).text(formatCurrency(itemTotal), colTotal, y + 12, { width: 70, align: 'right' });

    y += rowHeight;
    drawLine(y);
  }

  // ==================== TOTALS ====================
  if (y > doc.page.height - 250) {
    doc.addPage();
    y = 50;
  }

  y += 20;
  const totalsWidth = 300;
  const totalsStart = doc.page.width - layout.margin - totalsWidth;

  const drawTotalRow = (label, value, isBold = false, isGrand = false) => {
    doc.fontSize(isGrand ? 12 : 10).font(isBold ? fonts.bold : fonts.regular).fillColor(colors.text);
    doc.text(label, totalsStart, y, { width: 150, align: 'left' });
    doc.text(formatCurrency(value), totalsStart + 150, y, { width: 150, align: 'right' });
    y += isGrand ? 25 : 18;
  };

  drawTotalRow('Subtotal', order.subtotal);
  if (order.discountAmount > 0) drawTotalRow('Discount', order.discountAmount);
  drawTotalRow('Shipping', order.shippingCost);
  if (order.tax > 0 || order.vatAmount > 0) drawTotalRow('Tax/VAT', order.tax || order.vatAmount);

  y += 5;
  doc.moveTo(totalsStart, y).lineTo(doc.page.width - layout.margin, y).strokeColor(colors.border).stroke();
  y += 10;

  drawTotalRow('Total', order.total, true, true);

  // ==================== FOOTER ====================
  const footerY = doc.page.height - 130;
  doc.fontSize(8).font(fonts.bold).fillColor(colors.text).text('TERMS & CONDITIONS', layout.margin, footerY);
  doc.fontSize(8).font(fonts.regular).text(
    'Payment is due within 15 days. Please check the goods upon delivery. Returns accepted within 7 days with original receipt.',
    layout.margin, footerY + 15, { width: 250 }
  );

  const sigX = doc.page.width - layout.margin - 150;
  const sigLineY = footerY + 30;
  doc.moveTo(sigX, sigLineY).lineTo(doc.page.width - layout.margin, sigLineY).strokeColor(colors.border).stroke();
  doc.fontSize(8).font(fonts.bold).text('Authorized Signatory', sigX, sigLineY + 5, { width: 150, align: 'center' });

  const bottomTextY = doc.page.height - 80;
  doc.fontSize(9).font(fonts.regular).fillColor(colors.text).text('Thank you for your business!', layout.margin, bottomTextY, {
    align: 'center', width: doc.page.width - layout.margin * 2,
  });
};

module.exports = { generateInvoicePDF };
