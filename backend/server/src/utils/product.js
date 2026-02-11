const prisma = require('../config/prisma');

/**
 * Generate unique SKU
 * Format: CAT-BRAND-RANDOM (e.g., "ELE-APPLE-A1B2C3")
 */
async function generateSKU(productName, categoryId) {
  try {
    // Get category code
    let categoryCode = 'GEN';
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true }
      });
      if (category) {
        categoryCode = category.name.substring(0, 3).toUpperCase();
      }
    }

    // Get product initials
    const productInitials = productName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 3)
      .toUpperCase();

    // Generate random alphanumeric
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Combine
    const sku = `${categoryCode}-${productInitials}-${random}`;

    // Check uniqueness
    const existing = await prisma.product.findFirst({
      where: { sku }
    });

    if (existing) {
      // Recursively generate new SKU if collision
      return generateSKU(productName, categoryId);
    }

    return sku;
  } catch (error) {
    // Fallback SKU
    return `SKU-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Generate EAN-13 barcode
 * (Simplified - In production, use proper EAN-13 algorithm)
 */
function generateBarcode() {
  // Generate 12 random digits
  let barcode = '';
  for (let i = 0; i < 12; i++) {
    barcode += Math.floor(Math.random() * 10);
  }

  // Calculate check digit (EAN-13 algorithm)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return barcode + checkDigit;
}

/**
 * Validate EAN-13 barcode
 */
function validateBarcode(barcode) {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(barcode[12]);
}

/**
 * Generate batch of unique barcodes
 */
async function generateBarcodes(count) {
  const barcodes = new Set();

  while (barcodes.size < count) {
    const barcode = generateBarcode();

    // Check uniqueness in database
    const existing = await prisma.product.findFirst({
      where: { barcode }
    });

    if (!existing) {
      barcodes.add(barcode);
    }
  }

  return Array.from(barcodes);
}

/**
 * Format price for display
 */
function formatPrice(price, currency = '৳') {
  return `${currency}${parseFloat(price).toFixed(2)}`;
}

/**
 * Calculate profit margin
 */
function calculateProfit(sellingPrice, costPrice) {
  if (!costPrice || costPrice === 0) return null;

  const profit = sellingPrice - costPrice;
  const margin = (profit / sellingPrice) * 100;

  return {
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    marginPercentage: `${Math.round(margin)}%`
  };
}

/**
 * Check if product is low stock
 */
function isLowStock(product) {
  if (!product.trackInventory) return false;
  return product.stock <= (product.lowStockAlert || 10);
}

/**
 * Get stock status
 */
function getStockStatus(product) {
  if (!product.trackInventory) {
    return { status: 'UNLIMITED', label: 'In Stock', color: 'green' };
  }

  if (product.stock === 0) {
    return { status: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'red' };
  }

  if (isLowStock(product)) {
    return { status: 'LOW_STOCK', label: `Only ${product.stock} left`, color: 'orange' };
  }

  return { status: 'IN_STOCK', label: 'In Stock', color: 'green' };
}

/**
 * Calculate inventory value
 */
function calculateInventoryValue(products) {
  let totalValue = 0;
  let totalCost = 0;

  products.forEach(product => {
    const value = product.sellingPrice * product.stock;
    const cost = (product.costPrice || 0) * product.stock;

    totalValue += value;
    totalCost += cost;
  });

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    potentialProfit: Math.round((totalValue - totalCost) * 100) / 100
  };
}

module.exports = {
  generateSKU,
  generateBarcode,
  validateBarcode,
  generateBarcodes,
  formatPrice,
  calculateProfit,
  isLowStock,
  getStockStatus,
  calculateInventoryValue
};