'use client';

import { useSettings } from '@/context/SettingsContext';
import { trackPageView } from '@/lib/analytics';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

export default function AnalyticsScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = useSettings();

  // Ensure these are arrays (handle potential single string or null/undefined from API)
  const getIds = (ids: string | string[] | undefined): string[] => {
    if (!ids) return [];
    if (Array.isArray(ids)) return ids;
    return [ids];
  };

  const gtmIds = getIds(
    settings?.integration?.googleTagManagerId || settings?.seo?.googleTagManagerId
  );
  const ga4Ids = getIds(
    settings?.integration?.googleAnalyticsId || settings?.seo?.googleAnalyticsId
  );
  const pixelIds = getIds(settings?.integration?.facebookPixelId || settings?.seo?.facebookPixelId);

  useEffect(() => {
    if (pathname) {
      // GA4 Page Views
      const gtag = window.gtag;
      if (gtag && ga4Ids.length > 0) {
        ga4Ids.forEach((id) => {
          gtag('config', id, {
            page_path: pathname,
          });
        });
      }

      // Meta Pixel Page Views
      const fbq = window.fbq;
      if (fbq && pixelIds.length > 0) {
        // Facebook Pixel automatically tracks for all initialized IDs if you call track
        // But let's be explicit if needed, though standard 'track' calls send to all initialized pixels.
        // Actually, fbq('track', 'PageView') sends to all initialized IDs.
        fbq('track', 'PageView');
      }
      // Internal analytics
      trackPageView(pathname);
    }
  }, [pathname, searchParams, ga4Ids, pixelIds]);

  return (
    <>
      {/* Google Tag Manager - Base */}
      {gtmIds.map((id) => (
        <Script key={id} id={`google-tag-manager-${id}`} strategy="afterInteractive">
          {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${id}');
      `}
        </Script>
      ))}

      {/* Google Analytics 4 */}
      {ga4Ids.length > 0 && (
        <>
          {/* Load gtag.js only once if possible, or for each ID if they need separate config loading?
              Actually, loading gtag.js once is usually enough, but let's follow standard docs.
              Multiple Google tags: https://developers.google.com/tag-platform/gtagjs/install#add_multiple_google_tags
              You just need to config each one. One script tag is enough usually, but to be safe and simple:
          */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Ids[0]}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          ${ga4Ids.map((id) => `gtag('config', '${id}');`).join('\n')}
        `}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {pixelIds.length > 0 && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        ${pixelIds.map((id) => `fbq('init', '${id}');`).join('\n')}
        fbq('track', 'PageView');
      `}
        </Script>
      )}
    </>
  );
}
