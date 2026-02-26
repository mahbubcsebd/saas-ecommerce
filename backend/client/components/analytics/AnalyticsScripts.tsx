'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

interface SeoSetting {
  googleAnalyticsId?: string[];
  facebookPixelId?: string[];
  googleTagManagerId?: string[];
}

export default function AnalyticsScripts() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ids, setIds] = useState<{
    gtmIds: string[];
    ga4Ids: string[];
    pixelIds: string[];
  }>({ gtmIds: [], ga4Ids: [], pixelIds: [] });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use relative URL or ensure NEXT_PUBLIC_API_URL is available
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${API_URL}/settings/public`);
        const data = await res.json();

        if (data.success && data.data?.seo) {
          const seo: SeoSetting = data.data.seo;
          const getIds = (ids: string | string[] | undefined): string[] => {
            if (!ids) return [];
            if (Array.isArray(ids)) return ids;
            return [ids];
          };

          setIds({
            gtmIds: getIds(seo.googleTagManagerId),
            ga4Ids: getIds(seo.googleAnalyticsId),
            pixelIds: getIds(seo.facebookPixelId),
          });
        }
      } catch (error) {
        console.error("Failed to fetch analytics settings", error);
      }
    };

    fetchSettings();
  }, []); // Run once on mount

  const { gtmIds, ga4Ids, pixelIds } = ids;

  useEffect(() => {
    if (pathname) {
      // GA4 Page Views
      if (window.gtag && ga4Ids.length > 0) {
        ga4Ids.forEach((id) => {
          window.gtag('config', id, {
            page_path: pathname,
          });
        });
      }

      // Meta Pixel Page Views
      if (window.fbq && pixelIds.length > 0) {
        window.fbq('track', 'PageView');
      }
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
          <Script
             src={`https://www.googletagmanager.com/gtag/js?id=${ga4Ids[0]}`}
             strategy="afterInteractive"
          />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
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
