'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function SiteAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionIdRef = useRef<string | null>(null);
  const clientIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Manage Client ID (Persistent)
    let clientId = localStorage.getItem('mahbub_shop_client_id');
    if (!clientId) {
      clientId = uuidv4();
      localStorage.setItem('mahbub_shop_client_id', clientId);
    }
    clientIdRef.current = clientId;

    // 2. Manage Session ID (Session based)
    let sessionId = sessionStorage.getItem('mahbub_shop_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('mahbub_shop_session_id', sessionId);
    }
    sessionIdRef.current = sessionId;
  }, []);

  useEffect(() => {
    if (!pathname || !clientIdRef.current || !sessionIdRef.current) return;

    const trackPageView = async () => {
      try {
        const BACKEND_URL =
          process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

        // Extract UTM params
        const utmParams = {
          source: searchParams.get('utm_source'),
          medium: searchParams.get('utm_medium'),
          campaign: searchParams.get('utm_campaign'),
          term: searchParams.get('utm_term'),
          content: searchParams.get('utm_content'),
        };

        const payload = {
          eventName: 'page_view',
          eventType: 'PAGE_VIEW',
          pageUrl: window.location.href,
          pageTitle: document.title,
          referrer: document.referrer,
          clientId: clientIdRef.current,
          sessionId: sessionIdRef.current,
          utmParams,
        };

        await fetch(`${BACKEND_URL}/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        // Silently fail analytics
      }
    };

    // Small delay to ensure document title is updated by Next.js
    const timer = setTimeout(trackPageView, 500);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
