import { Metadata } from 'next';
import { notFound } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPage(slug: string) {
  try {
    const response = await fetch(
      `${API_BASE}/landing-pages/public/${slug}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
    keywords: page.metaKeywords,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription,
      images: page.ogImage ? [page.ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle || page.title,
      description: page.metaDescription,
      images: page.ogImage ? [page.ogImage] : [],
    },
  };
}

export default async function PublicLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  // Use variant content if A/B test is active
  const html = page.selectedVariant?.gjs_html || page.gjs_html || '';
  const css = page.selectedVariant?.gjs_css || page.gjs_css || '';

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />

      {/* Inject CSS */}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Render HTML */}
      <div dangerouslySetInnerHTML={{ __html: html }} />

      {/* Analytics Tracking Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const sessionId = sessionStorage.getItem('lp_session') ||
                'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              sessionStorage.setItem('lp_session', sessionId);

              // Track page view
              fetch('${API_BASE}/landing-pages/track-conversion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: '${page.id}',
                  variantId: '${page.selectedVariant?.id || ""}',
                  event: 'VIEW',
                  sessionId: sessionId,
                }),
              });

              // Track clicks
              document.addEventListener('click', function(e) {
                const target = e.target;
                const button = target.closest('button, a');
                if (button) {
                  fetch('${API_BASE}/landing-pages/track-conversion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: '${page.id}',
                      variantId: '${page.selectedVariant?.id || ""}',
                      event: 'CLICK',
                      elementId: button.id || button.className,
                      sessionId: sessionId,
                    }),
                  });
                }
              });

              // Track form submissions
              document.addEventListener('submit', function(e) {
                fetch('${API_BASE}/landing-pages/track-conversion', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: '${page.id}',
                    variantId: '${page.selectedVariant?.id || ""}',
                    event: 'SUBMIT',
                    elementId: e.target.id,
                    sessionId: sessionId,
                  }),
                });
              });
            })();
          `,
        }}
      />
    </>
  );
}
