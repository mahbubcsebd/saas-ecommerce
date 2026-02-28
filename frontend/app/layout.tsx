import { Providers } from '@/components/Providers';
import StoreHydration from '@/components/StoreHydration';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster as SonnerToaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

async function getSeoSettings() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  try {
    const res = await fetch(`${apiUrl}/settings/public`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data.seo : null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  const title = seo?.metaTitle || 'Mahbub Shop - Premium Ecommerce';
  const description = seo?.metaDescription || 'Experience the best online shopping with Mahbub Shop.';

  return {
    title: {
      default: title,
      template: `%s | Mahbub Shop`
    },
    description,
    keywords: seo?.metaKeywords,
    verification: {
      google: seo?.googleSiteVerification,
    },
    openGraph: {
      title,
      description,
      images: seo?.ogImageUrl ? [{ url: seo.ogImageUrl }] : [],
      type: 'website',
    },
    robots: {
      index: seo?.allowIndexing !== false,
      follow: seo?.allowIndexing !== false,
    }
  };
}

import { ClientWidgets } from '@/components/ClientWidgets';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ClientWidgets />
          <StoreHydration />
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
