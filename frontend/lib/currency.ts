/**
 * Currency Formatting Utility
 * Formats prices based on backend currency settings
 */

export interface CurrencySettings {
  code: string;
  symbol: string;
  symbolPosition: 'LEFT' | 'RIGHT';
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
}

/**
 * Format a price with currency symbol
 * @param amount - The numeric amount to format
 * @param settings - Currency settings from backend
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number | string,
  settings?: CurrencySettings
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '0';

  // Default settings (fallback)
  const {
    symbol = '৳',
    symbolPosition = 'LEFT',
    decimalPlaces = 2,
    decimalSeparator = '.',
    thousandSeparator = ','
  } = settings || {};

  // Format number with separators
  const parts = numAmount.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const formattedAmount = parts[1]
    ? `${integerPart}${decimalSeparator}${parts[1]}`
    : integerPart;

  // Apply symbol position
  if (symbolPosition === 'RIGHT') {
    return `${formattedAmount}${symbol}`;
  }
  return `${symbol}${formattedAmount}`;
}

/**
 * Format currency without symbol (just number formatting)
 */
export function formatNumber(
  amount: number | string,
  settings?: CurrencySettings
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '0';

  const {
    decimalPlaces = 2,
    decimalSeparator = '.',
    thousandSeparator = ','
  } = settings || {};

  const parts = numAmount.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  return parts[1]
    ? `${integerPart}${decimalSeparator}${parts[1]}`
    : integerPart;
}
