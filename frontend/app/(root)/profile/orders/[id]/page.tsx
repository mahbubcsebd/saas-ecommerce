'use client';

import { useTranslations } from '@/context/TranslationContext';
import { getOrderStatusConfig } from '@/lib/order-utils';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Info,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslations();
  const { data: session, status } = useSession();

  const statusSteps = [
    {
      status: 'PENDING',
      label: t('orders', 'ordered', 'Ordered'),
      icon: Clock,
      description: t('orders', 'orderedDesc', 'Order has been placed successfully.'),
    },
    {
      status: 'CONFIRMED',
      label: t('orders', 'confirmed', 'Confirmed'),
      icon: CheckCircle2,
      description: t('orders', 'confirmedDesc', 'Order has been confirmed by the seller.'),
    },
    {
      status: 'PROCESSING',
      label: t('orders', 'processing', 'Processing'),
      icon: Package,
      description: t('orders', 'processingDesc', 'Your items are being packed and prepared.'),
    },
    {
      status: 'SHIPPED',
      label: t('orders', 'shipped', 'Shipped'),
      icon: Truck,
      description: t('orders', 'shippedDesc', 'Order is on the way to your destination.'),
    },
    {
      status: 'DELIVERED',
      label: t('orders', 'delivered', 'Delivered'),
      icon: Box,
      description: t('orders', 'deliveredDesc', 'Order has been successfully delivered.'),
    },
  ];
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/profile/orders/${id}`);
      return;
    }

    const fetchOrder = async () => {
      if (status !== 'authenticated' || !session?.accessToken) return;
      try {
        const res = await fetch(`${API_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.data);
      } catch (error) {
        console.error('Order fetch error:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchOrder();
    }
  }, [id, session, status, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-tight">{t('common', 'loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 px-8 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Info className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('orders', 'notFound', 'Order Not Found')}
        </h2>
        <p className="text-slate-500 mt-2 mb-8">
          {t('orders', 'notFoundDesc', "This order doesn't exist or you don't have access to it.")}
        </p>
        <Link
          href="/profile/orders"
          className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary dark:hover:bg-primary hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> {t('orders', 'backToHistory', 'Back to History')}
        </Link>
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order.status.toUpperCase());
  const statusConfig = getOrderStatusConfig(order.status);
  const formatPrice = (price: number) => `৳${price?.toLocaleString()}`;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{' '}
            {t('orders', 'backToOrders', 'Back to Orders')}
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('orders', 'orderNumber', 'Order #')} {order.orderNumber || order.id.slice(-8)}
            </h1>
            <div
              className={cn(
                'px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border',
                statusConfig.bgColor,
                statusConfig.color,
                statusConfig.borderColor
              )}
            >
              {statusConfig.label}
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t('orders', 'placedOn', { defaultValue: 'Placed on' })}{' '}
            <span className="text-slate-900 dark:text-slate-200 font-bold">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${API_URL}/invoices/${order.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> {t('orders', 'downloadInvoice', 'Download Invoice')}
          </a>
          {order.status === 'DELIVERED' && (
            <Link
              href={`/profile/returns/create?orderId=${order.id}`}
              className="flex items-center gap-2 bg-rose-50 text-rose-600 px-6 py-2.5 rounded-xl text-sm font-bold border border-rose-100 hover:bg-rose-100 transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> {t('orders', 'return', { defaultValue: 'Return' })}
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          {/* Tracking Status Timeline */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-bold">
                {t('orders', 'trackingStatus', 'Tracking Status')}
              </h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
              >
                {showHistory
                  ? t('orders', 'hideDetailedLog', 'Hide Detailed Log')
                  : t('orders', 'detailedLog', 'Detailed Log')}{' '}
                {showHistory ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0">
              {/* Horizontal Line for Desktop */}
              <div className="hidden md:block absolute top-[1.25rem] left-[5%] right-[5%] h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>

              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;

                return (
                  <div
                    key={step.status}
                    className="relative z-10 flex md:flex-col items-center gap-4 md:w-1/5"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                        isCompleted
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-300'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isCurrent && 'animate-pulse')} />
                    </div>
                    <div className="md:text-center">
                      <p
                        className={cn(
                          'text-xs font-bold uppercase tracking-wider',
                          isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Log Expansion */}
            {showHistory && (
              <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-6">
                  {statusSteps
                    .filter((_, idx) => idx <= currentStatusIndex)
                    .reverse()
                    .map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {step.label ? step.label.toUpperCase() : step.status}
                          </p>
                          <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            {step.description ||
                              t('orders', 'statusUpdateGeneric', {
                                defaultValue: 'The order status has been updated to ',
                              }) +
                                step.label.toLowerCase() +
                                '.'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />{' '}
              {t('orders', 'itemsOrdered', 'Items Ordered')}
            </h3>

            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden relative shrink-0">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product?.images[0]}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-bold">
                            {t('common', 'noImage', 'No Image')}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                          {item.productName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {item.sku}
                          </p>
                          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest font-medium">
                            {t('common', 'qty', { defaultValue: 'Qty' })}: {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-50 dark:border-slate-800 md:min-w-[120px]">
                      <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {formatPrice(item.totalPrice)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatPrice(item.unitPrice)} / {t('common', 'unit', 'unit')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Summary & Shipping */}
        <div className="lg:col-span-4 space-y-10">
          {/* Payment Summary */}
          <div className="bg-slate-900 dark:bg-slate-900 rounded-3xl p-8 text-white shadow-xl space-y-8">
            <h3 className="text-lg font-bold">{t('common', 'summaryTitle', 'Summary')}</h3>

            <div className="space-y-4">
              <div className="flex justify-between text-white/60 text-xs font-bold uppercase tracking-wider">
                <span>{t('common', 'subtotal', 'Items Subtotal')}</span>
                <span className="text-white">+{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span>{t('common', 'discount', 'Promo Discount')}</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/60 text-xs font-bold uppercase tracking-wider">
                <span>{t('orders', 'shippingFee', 'Shipping Fee')}</span>
                <span className="text-white">+{formatPrice(order.shippingCost)}</span>
              </div>

              <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {t('orders', 'totalAmount', 'Total Amount')}
                  </span>
                  <p className="text-3xl font-bold tracking-tight">{formatPrice(order.total)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-slate-950 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">
                  {t('orders', 'shippingInfo', 'Shipping Information')}
                </h3>
              </div>
              {order.shippingAddress?.addressType && (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-widest rounded-full text-slate-500">
                  {order.shippingAddress.addressType}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {t('orders', 'recipientName', 'Recipient Name')}
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {order.shippingAddress?.name ||
                      order.shippingAddress?.fullName ||
                      'Not Specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {t('common', 'phone')}
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {order.shippingAddress?.phone || 'Not Specified'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 text-right md:text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 md:justify-start justify-end">
                    <MapPin className="w-3 h-3" /> {t('orders', 'fullAddress', 'Full Address')}
                  </p>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>{order.shippingAddress?.street || order.shippingAddress?.address}</p>
                    <p>
                      <span className="text-slate-400">{t('orders', 'thana', 'Thana')}:</span>{' '}
                      {order.shippingAddress?.city || 'N/A'},{' '}
                      <span className="text-slate-400">{t('orders', 'district', 'Dist')}:</span>{' '}
                      {order.shippingAddress?.state || 'N/A'}
                    </p>
                    <p>
                      <span className="text-slate-400">{t('orders', 'zip', 'ZIP')}:</span>{' '}
                      {order.shippingAddress?.zipCode || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
