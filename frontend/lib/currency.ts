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
  /** When false (default), trailing zeros are stripped: ৳100.00 → ৳100, ৳100.50 → ৳100.5 */
  showPriceDecimals?: boolean;
}

/**
 * Format a numeric amount, applying thousand separators and optional decimal display.
 * When showPriceDecimals is false, trailing zeros after the decimal point are removed.
 */
function _formatNumber(
  numAmount: number,
  decimalPlaces: number,
  decimalSeparator: string,
  thousandSeparator: string,
  showPriceDecimals: boolean,
): string {
  const fixed = numAmount.toFixed(decimalPlaces);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  if (!parts[1]) return integerPart;

  // Strip trailing zeros unless showPriceDecimals is enabled
  const decimals = showPriceDecimals ? parts[1] : parts[1].replace(/0+$/, '');
  return decimals ? `${integerPart}${decimalSeparator}${decimals}` : integerPart;
}

/**
 * Format a price with currency symbol
 * @param amount - The numeric amount to format
 * @param settings - Currency settings from backend
 * @returns Formatted price string
 */
export function formatPrice(amount: number | string, settings?: CurrencySettings): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (amount === null || amount === undefined || isNaN(numAmount as number)) return '0';

  // Default settings (fallback)
  const {
    symbol = '৳',
    symbolPosition = 'LEFT',
    decimalPlaces = 2,
    decimalSeparator = '.',
    thousandSeparator = ',',
    showPriceDecimals = false,
  } = settings || {};

  const formattedAmount = _formatNumber(
    numAmount,
    decimalPlaces,
    decimalSeparator,
    thousandSeparator,
    showPriceDecimals,
  );

  // Apply symbol position
  if (symbolPosition === 'RIGHT') {
    return `${formattedAmount}${symbol}`;
  }
  return `${symbol}${formattedAmount}`;
}

/**
 * Format currency without symbol (just number formatting)
 */
export function formatNumber(amount: number | string, settings?: CurrencySettings): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (amount === null || amount === undefined || isNaN(numAmount as number)) return '0';

  const {
    decimalPlaces = 2,
    decimalSeparator = '.',
    thousandSeparator = ',',
    showPriceDecimals = false,
  } = settings || {};

  return _formatNumber(numAmount, decimalPlaces, decimalSeparator, thousandSeparator, showPriceDecimals);
}
