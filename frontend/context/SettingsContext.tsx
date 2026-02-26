"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Define Types based on Backend Models
export interface GeneralSetting {
  siteName: string;
  tagline?: string;
  description?: string;
  logoUrl?: string; // Legacy
  headerLogo?: string;
  footerLogo?: string;
  favicon?: string;
  maintenanceMode: boolean;
  shopType: "GADGET" | "CLOTHING";
  copyrightText?: string;
}

export interface CurrencySetting {
  code: string;
  symbol: string;
  symbolPosition: "LEFT" | "RIGHT";
  decimalPlaces: number;
}

export interface ContactSetting {
  email?: string;
  phone?: string;
  whatsapp?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  // Socials
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  pinterest?: string;

  // Additional Info
  workingHours?: string;
  mapUrl?: string;
  copyrightText?: string;
}

export interface AppearanceSetting {
  primaryColor: string;
  secondaryColor?: string;
  fontFamily: string;
  showHeroBanner: boolean;
}

export interface SeoSetting {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  googleAnalyticsId?: string[];
  facebookPixelId?: string[];
  googleTagManagerId?: string[];
}

export interface SettingsData {
  general: GeneralSetting;
  currency: CurrencySetting;
  contact: ContactSetting;
  appearance: AppearanceSetting;
  seo?: SeoSetting;
}

interface SettingsContextType {
  settings: SettingsData | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${API_URL}/settings/public`, { cache: 'no-store' });
        // Use no-store to ensure we get fresh settings if they change
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
