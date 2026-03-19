'use client';

import { useTranslations } from '@/context/TranslationContext';
import { getOrderStatusConfig } from '@/lib/order-utils';
import { cn } from '@/lib/utils';
import { Calendar, FileText, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product: {
    name: string;
    images: string[];
    slug: string;
  };
  variant?: {
    name: string;
    images?: string[];
  };
  quantity: number;
  salePrice: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  formatPrice: (price: number) => string;
}

export default function OrderCard({ order, formatPrice }: OrderCardProps) {
  const { t } = useTranslations();
  const statusConfig = getOrderStatusConfig(order.status);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-primary/20 transition-all duration-300 overflow-hidden hover:-translate-y-1 active:scale-[0.99]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold border',
              statusConfig.bgColor,
              statusConfig.color,
              statusConfig.borderColor
            )}
          >
            {statusConfig.label}
          </div>
          <span className="text-sm font-medium text-slate-500">
            #{order.orderNumber || order.id.slice(-8).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <Wallet className="w-4 h-4 text-slate-400" />
            {formatPrice(order.total)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 overflow-hidden">
              {order.items?.slice(0, 4).map((item, idx) => {
                const displayImage = item.variant?.images?.[0] || item.product?.images?.[0];
                return (
                  <div
                    key={idx}
                    className="relative w-12 h-12 rounded-lg border-2 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-800 overflow-hidden shadow-sm"
                  >
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={item.product?.name || t('common', 'product')}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 p-1 text-center">
                        No Img
                      </div>
                    )}
                  </div>
                );
              })}
              {order.items?.length > 4 && (
                <div className="relative w-12 h-12 rounded-lg border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-500">
                  +{order.items.length - 4}
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {order.items?.[0]?.product?.name || t('common', 'product')}
                {order.items?.length > 1 &&
                  ` ${t('common', 'and')} ${order.items.length - 1} ${t('common', 'otherItems')}`}
              </p>
              <p className="text-xs font-medium text-slate-500">
                {order.items?.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                {t('orders', 'itemsTotal', { defaultValue: 'items total' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href={`/profile/orders/${order.id}`}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm font-bold hover:bg-primary hover:text-white dark:hover:bg-primary transition-colors"
            >
              {t('orders', 'viewDetails', { defaultValue: 'View Details' })}
            </Link>
            <Link
              href={`/orders/${order.id}/invoice`}
              className="inline-flex items-center justify-center w-10 h-10 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-lg hover:text-primary transition-colors"
              title={t('orders', 'invoice', { defaultValue: 'Invoice' })}
            >
              <FileText className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
