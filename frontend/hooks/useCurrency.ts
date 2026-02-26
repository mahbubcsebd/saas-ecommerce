"use client";

import { useSettings } from "@/context/SettingsContext";
import { CurrencySettings, formatNumber, formatPrice } from "@/lib/currency";

/**
 * Hook to access currency formatting functions
 * Uses currency settings from backend
 */
export function useCurrency() {
  const { settings, loading } = useSettings();

  const currencySettings: CurrencySettings = {
    code: "BDT",
    symbol: "৳",
    symbolPosition: "LEFT",
    decimalPlaces: 2,
    decimalSeparator: ".",
    thousandSeparator: ",",
    ...settings?.currency
  };

  return {
    formatPrice: (amount: number | string) => formatPrice(amount, currencySettings),
    formatNumber: (amount: number | string) => formatNumber(amount, currencySettings),
    currency: currencySettings,
    loading
  };
}
