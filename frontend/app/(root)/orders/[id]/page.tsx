'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/context/TranslationContext';
import { useCurrency } from '@/hooks/useCurrency';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useTranslations();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/${id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || 'Failed to load order');
        }
      } catch (e) {
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  if (loading) return <div className="container py-12">{t('common', 'loading', 'Loading...')}</div>;
  if (error) return <div className="container py-12 text-destructive">{error}</div>;
  if (!order) return null;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('orders', 'orderNumber', 'Order #')}
            {order.orderNumber || order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('orders', 'status', 'Status')}: {order.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/orders/${order.id}/invoice`}>
              {t('common', 'viewInvoice', 'View Invoice')}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/profile/orders">{t('profile', 'myOrders', 'My Orders')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold">{t('common', 'itemsTitle', 'Items')}</h2>
          <div className="divide-y rounded-md border">
            {order.items.map((it: any) => (
              <div key={it.id} className="p-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">
                    {it.product?.name || t('common', 'product', 'Item')}
                  </div>
                  {it.variant?.name && (
                    <div className="text-xs text-muted-foreground">{it.variant.name}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm">x{it.quantity}</div>
                  <div className="font-medium">
                    {formatPrice(it.salePrice || it.unitPrice || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">{t('common', 'summaryTitle', 'Summary')}</h2>
          <div className="rounded-md border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t('common', 'subtotal', 'Subtotal')}</span>
              <span>{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('common', 'shipping', 'Shipping')}</span>
              <span>{formatPrice(order.shippingCost || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('common', 'vat', 'VAT')}</span>
              <span>{formatPrice(order.vatAmount || 0)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>{t('common', 'total', 'Total')}</span>
              <span>{formatPrice(order.total || 0)}</span>
            </div>
          </div>

          <h2 className="font-semibold">{t('common', 'shipping', 'Shipping')}</h2>
          <div className="rounded-md border p-4 text-sm space-y-1">
            <div>{order.shippingAddress?.street}</div>
            <div>
              {order.shippingAddress?.city}, {order.shippingAddress?.state}
            </div>
            <div>
              {order.shippingAddress?.country || 'Bangladesh'} - {order.shippingAddress?.zipCode}
            </div>
            <div>{order.shippingAddress?.phone}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
