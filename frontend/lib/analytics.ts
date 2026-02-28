import { api } from '@/lib/api-client';

type Product = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  variant?: string;
};
const getSessionId = () => {
  if (typeof window === 'undefined') return undefined;

  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const trackInternalEvent = async (eventName: string, eventType: string, data: any) => {
  try {
    const sessionId = getSessionId();

    await api.post('/analytics/track', {
      eventName,
      eventType,
      sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      pageTitle: typeof window !== 'undefined' ? document.title : undefined,
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      productId: data?.id,
      productName: data?.name,
      productPrice: data?.price,
      quantity: data?.quantity,
      eventData: data,
    });
  } catch (error) {
    console.error('Internal analytics error:', error);
  }
};

export const trackPageView = (url: string, title?: string) => {
  trackInternalEvent('page_view', 'PAGE_VIEW', { url, title });
};

const pushToDataLayer = (data: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
};

export const trackAddToCart = (product: Product) => {
  // Internal
  trackInternalEvent('add_to_cart', 'ECOMMERCE', product);

  // Data Layer (GTM)
  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'BDT',
      value: product.price * (product.quantity || 1),
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          item_category: product.category,
          item_variant: product.variant,
        },
      ],
    },
  });

  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'BDT',
      value: product.price * (product.quantity || 1),
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          item_category: product.category,
          item_variant: product.variant,
        },
      ],
    });
  }

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price * (product.quantity || 1),
      currency: 'BDT',
    });
  }
};

export const trackBeginCheckout = (items: Product[], total: number) => {
  // Internal
  trackInternalEvent('begin_checkout', 'ECOMMERCE', { items, total });

  // Data Layer (GTM)
  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BDT',
      value: total,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        item_category: item.category,
        item_variant: item.variant,
      })),
    },
  });

  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'BDT',
      value: total,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        item_category: item.category,
        item_variant: item.variant,
      })),
    });
  }

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map((i) => i.id),
      content_type: 'product',
      value: total,
      currency: 'BDT',
      num_items: items.length,
    });
  }
};

export const trackViewContent = (product: Product) => {
  // Internal
  trackInternalEvent('view_item', 'ECOMMERCE', product);

  // Data Layer (GTM)
  pushToDataLayer({
    event: 'view_item',
    ecommerce: {
      currency: 'BDT',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          item_variant: product.variant,
        },
      ],
    },
  });

  // GA4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'BDT',
      value: product.price,
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_category: product.category,
          item_variant: product.variant,
        },
      ],
    });
  }

  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'BDT',
    });
  }
};

export const trackPurchase = (order: any) => {
  // Data Layer (GTM)
  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.id || order.orderNumber,
      value: order.total,
      currency: 'BDT',
      tax: order.tax || 0,
      shipping: order.shippingCost || 0,
      items: order.items?.map((item: any) => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.price,
        quantity: item.quantity,
        item_variant: item.variantId,
      })),
    },
  });
};
