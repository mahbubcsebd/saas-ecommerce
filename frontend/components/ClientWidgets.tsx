'use client';

import dynamic from 'next/dynamic';

const AnalyticsScripts = dynamic(() => import('@/components/analytics/AnalyticsScripts'), {
  ssr: false,
});

const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), {
  ssr: false,
});

export function ClientWidgets() {
  return (
    <>
      <AnalyticsScripts />
      <ChatWidget />
    </>
  );
}
