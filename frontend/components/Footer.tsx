"use client";

import { useSettings } from "@/context/SettingsContext";
import { useTranslations } from "@/context/TranslationContext";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const { settings } = useSettings();
  const { t } = useTranslations();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="space-y-4">
            {settings?.general?.footerLogo ? (
                <Link href="/" className="inline-block mb-4">
                  <img src={settings.general.footerLogo} alt={settings.general.siteName} className="h-10 w-auto" />
                </Link>
            ) : (
                <h3 className="text-lg font-bold">
                    {settings?.general?.siteName || "Mahbub Shop"}
                </h3>
            )}
            <p className="text-sm text-muted-foreground max-w-xs">
              {settings?.general?.tagline || "Your one-stop destination for premium products."}
            </p>
            <div className="flex space-x-4">
              {settings?.contact?.facebook && (
                <Link href={settings.contact.facebook} target="_blank" className="text-muted-foreground hover:text-primary">
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {settings?.contact?.instagram && (
                <Link href={settings.contact.instagram} target="_blank" className="text-muted-foreground hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {settings?.contact?.twitter && (
                <Link href={settings.contact.twitter} target="_blank" className="text-muted-foreground hover:text-primary">
                  <Twitter className="h-5 w-5" />
                </Link>
              )}
               {settings?.contact?.youtube && (
                <Link href={settings.contact.youtube} target="_blank" className="text-muted-foreground hover:text-primary">
                  <Youtube className="h-5 w-5" />
                </Link>
              )}
              {settings?.contact?.linkedin && (
                <Link href={settings.contact.linkedin} target="_blank" className="text-muted-foreground hover:text-primary">
                  <Linkedin className="h-5 w-5" />
                </Link>
              )}
              {/* Note: Lucide React might not have TikTok/Pinterest icons in older versions, using text fallback if needed or generic icons */}
               {settings?.contact?.tiktok && (
                <Link href={settings.contact.tiktok} target="_blank" className="text-muted-foreground hover:text-primary">
                  TikTok
                </Link>
              )}
               {settings?.contact?.pinterest && (
                <Link href={settings.contact.pinterest} target="_blank" className="text-muted-foreground hover:text-primary">
                  Pinterest
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('common', 'quickLinks', { defaultValue: 'Quick Links' })}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary">{t('common', 'home', { defaultValue: 'Home' })}</Link></li>
              <li><Link href="/products" className="text-muted-foreground hover:text-primary">{t('common', 'featuredProducts', { defaultValue: 'Products' })}</Link></li>
              <li><Link href="/categories" className="text-muted-foreground hover:text-primary">{t('common', 'shopByCategory', { defaultValue: 'Categories' })}</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-primary">{t('common', 'aboutUs', { defaultValue: 'About Us' })}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('common', 'customerService', { defaultValue: 'Customer Service' })}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary">{t('common', 'contactUs', { defaultValue: 'Contact Us' })}</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-primary">{t('common', 'myAccount', { defaultValue: 'My Account' })}</Link></li>
              <li><Link href="/profile/orders" className="text-muted-foreground hover:text-primary">{t('common', 'trackOrder', { defaultValue: 'Track Order' })}</Link></li>
              <li><Link href="/policy" className="text-muted-foreground hover:text-primary">{t('common', 'privacyPolicy', { defaultValue: 'Privacy Policy' })}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('common', 'contactInfo', { defaultValue: 'Contact Info' })}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {settings?.contact?.addressLine1 && (
                 <li>{settings.contact.addressLine1}, {settings.contact.city}</li>
              )}
              {settings?.contact?.country && (
                 <li>{settings.contact.country}</li>
              )}
              {settings?.contact?.email && (
                 <li>Email: {settings.contact.email}</li>
              )}
              {settings?.contact?.phone && (
                 <li>Phone: {settings.contact.phone}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
             <p>{settings?.general?.copyrightText || t('common', 'footerCopyright').replace('2026', currentYear.toString())}</p>
        </div>
      </div>
    </footer>
  );
}
