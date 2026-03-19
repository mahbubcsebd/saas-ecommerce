import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import SiteAnalyticsTracker from '@/components/analytics/SiteAnalyticsTracker';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import AuthProvider from '@/components/providers/SessionProvider';
import { ConfirmationProvider } from '@/context/ConfirmationContext';
import { SocketProvider } from '@/context/SocketContext';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata = {
  title: 'Mahbub Shop - Modern E-commerce Platform',
  description: 'A professional e-commerce platform with advanced features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Analytics Scripts (Google Analytics, Meta Pixel, etc.) */}
        <Suspense fallback={null}>
          <AnalyticsScripts />
        </Suspense>

        {/* Internal Site Tracking */}
        <Suspense fallback={null}>
          <SiteAnalyticsTracker />
        </Suspense>

        {/* Providers Hierarchy */}
        <AuthProvider>
          <SocketProvider>
            <LanguageProvider>
              <ConfirmationProvider>
                {children}

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  expand={false}
                  richColors
                  closeButton
                  toastOptions={{
                    duration: 4000,
                    className: 'text-sm',
                  }}
                />
              </ConfirmationProvider>
            </LanguageProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
