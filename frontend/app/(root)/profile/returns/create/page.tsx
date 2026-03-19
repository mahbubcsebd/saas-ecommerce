'use client';

import { useTranslations } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, ChevronRight, Info, Loader2, ShoppingBag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const RETURN_REASONS = [
  { id: 'DEFECTIVE', labelKey: 'reasonDefective', defaultLabel: 'Item is defective/damaged' },
  { id: 'WRONG_ITEM', labelKey: 'reasonWrongItem', defaultLabel: 'Received the wrong item' },
  {
    id: 'NOT_AS_DESCRIBED',
    labelKey: 'reasonNotAsDescribed',
    defaultLabel: 'Item not as described',
  },
  { id: 'NO_LONGER_NEEDED', labelKey: 'reasonNoLongerNeeded', defaultLabel: 'No longer needed' },
  {
    id: 'BETTER_PRICE',
    labelKey: 'reasonBetterPrice',
    defaultLabel: 'Found a better price elsewhere',
  },
  { id: 'OTHER', labelKey: 'reasonOther', defaultLabel: 'Other' },
];

export default function CreateReturnPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const { t } = useTranslations();
  const { data: session, status } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated' || !orderId) {
      router.push(`/profile/orders`);
      return;
    }

    const fetchOrder = async () => {
      if (status !== 'authenticated' || !session?.accessToken) return;
      try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();

        // Only allow returns for DELIVERED orders
        if (data.data.status !== 'DELIVERED') {
          toast.error('Returns are only available for delivered orders.');
          router.push(`/profile/orders/${orderId}`);
          return;
        }

        setOrder(data.data);

        // Initialize quantities
        const initialQtys: Record<string, number> = {};
        data.data.items.forEach((item: any) => {
          const available = item.quantity - (item.returnedQuantity || 0);
          if (available > 0) {
            initialQtys[item.id] = 1;
          }
        });
        setQuantities(initialQtys);
      } catch (error) {
        console.error('Order fetch error:', error);
        toast.error('Failed to load order details');
        router.push('/profile/orders');
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchOrder();
    }
  }, [orderId, session, status, router]);

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleQtyChange = (itemId: string, val: number, max: number) => {
    const newQty = Math.max(1, Math.min(val, max));
    setQuantities((prev) => ({ ...prev, [itemId]: newQty }));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return.');
      return;
    }

    // Validate that all selected items have a reason
    for (const itemId of selectedItems) {
      if (!reasons[itemId]) {
        toast.error(`Please select a reason for all items.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // The backend endpoint might handle multiple items or single.
      // Looking at the controller, createReturn takes { orderId, productId, quantity, refundAmount, reason }.
      // It seems designed for a single product per request.
      // Let's loop if multiple items are selected or batch them if the backend supports it.
      // Based on ReturnRequest model, it links to ONE product.

      for (const itemId of selectedItems) {
        const item = order.items.find((i: any) => i.id === itemId);
        const payload = {
          orderId,
          productId: item.productId, // Could also be variantId if backend expects it
          quantity: quantities[itemId],
          reason: `${reasons[itemId]}: ${comments[itemId] || ''}`,
          refundAmount: item.unitPrice * quantities[itemId], // Basic calculation
        };

        const res = await fetch(`${API_URL}/returns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to submit return request');
        }
      }

      toast.success('Return request(s) submitted successfully!');
      router.push('/profile/returns');
    } catch (error: any) {
      console.error('Return submission error:', error);
      toast.error(error.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-bold text-sm tracking-tight">{t('common', 'loading')}</p>
      </div>
    );
  }

  const returnableItems = order.items.filter(
    (item: any) => item.quantity - (item.returnedQuantity || 0) > 0
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/profile/orders/${orderId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{' '}
          {t('returns', 'backToOrder', 'Back to Order')}
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t('returns', 'requestReturn', 'Request a Return')}
        </h1>
        <p className="text-slate-500 font-medium">
          {t('orders', 'orderNumber', 'Order #')} {order.orderNumber || order.id.slice(-8)} •{' '}
          {t('returns', 'deliveredOn', 'Delivered on')}{' '}
          {new Date(order.deliveredAt || order.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Policy Info */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 p-6 rounded-2xl flex gap-4">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
            {t('returns', 'importantInfo', 'Important Information')}
          </p>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
            {t(
              'returns',
              'policyNotice',
              'Please select the items you wish to return. Each item will be reviewed by our team. Refunds are processed to the original payment method after the items reach our warehouse.'
            )}
          </p>
        </div>
      </div>

      {/* Items Selection */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />{' '}
          {t('returns', 'selectItems', 'Select Items to Return')}
        </h3>

        <div className="space-y-4">
          {returnableItems.length > 0 ? (
            returnableItems.map((item: any) => (
              <div
                key={item.id}
                className={cn(
                  'bg-white dark:bg-slate-950 rounded-2xl border transition-all overflow-hidden',
                  selectedItems.includes(item.id)
                    ? 'border-primary ring-1 ring-primary/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                )}
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        'mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
                        selectedItems.includes(item.id)
                          ? 'bg-primary border-primary text-white'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      )}
                    >
                      {selectedItems.includes(item.id) && <CheckCircle2 className="w-4 h-4" />}
                    </button>

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

                    <div className="flex-1 space-y-1">
                      <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {item.productName}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {t('common', 'unitPrice')}: ৳{item.unitPrice.toLocaleString()}
                        {item.variant?.name && ` • ${t('common', 'variant')}: ${item.variant.name}`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {t('common', 'qty')}
                      </p>
                      <div className="inline-flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden h-10">
                        <button
                          disabled={!selectedItems.includes(item.id) || quantities[item.id] <= 1}
                          onClick={() =>
                            handleQtyChange(
                              item.id,
                              quantities[item.id] - 1,
                              item.quantity - (item.returnedQuantity || 0)
                            )
                          }
                          className="w-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-slate-900 dark:text-white border-x border-slate-200 dark:border-slate-800">
                          {quantities[item.id] || 1}
                        </span>
                        <button
                          disabled={
                            !selectedItems.includes(item.id) ||
                            quantities[item.id] >= item.quantity - (item.returnedQuantity || 0)
                          }
                          onClick={() =>
                            handleQtyChange(
                              item.id,
                              quantities[item.id] + 1,
                              item.quantity - (item.returnedQuantity || 0)
                            )
                          }
                          className="w-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Form Fields */}
                  {selectedItems.includes(item.id) && (
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            {t('returns', 'reason', 'Reason for Return')}{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={reasons[item.id] || ''}
                            onChange={(e) =>
                              setReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                          >
                            <option value="" disabled>
                              {t('common', 'select')}
                            </option>
                            {RETURN_REASONS.map((r) => (
                              <option key={r.id} value={r.id}>
                                {t('returns', r.labelKey, r.defaultLabel)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t('returns', 'refundMethod', 'Refund Method')}
                          </label>
                          <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 italic">
                            {t('returns', 'originalPayment', 'Original Payment Method')}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {t('returns', 'comments', 'Comments (Optional)')}
                        </label>
                        <textarea
                          placeholder={t(
                            'returns',
                            'commentsPlaceholder',
                            'Please provide more details about the issue...'
                          )}
                          value={comments[item.id] || ''}
                          onChange={(e) =>
                            setComments((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('returns', 'noItemsReturnable', 'No Items Returnable')}
              </h3>
              <p className="text-sm text-slate-500">
                {t(
                  'returns',
                  'noItemsReturnableDesc',
                  'All items from this order have already been returned or are ineligible.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky/Bottom Action */}
      <div className="sticky bottom-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t('returns', 'totalRefund', 'Total Refund Estimate')}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ৳
            {selectedItems
              .reduce((acc, id) => {
                const item = order.items.find((i: any) => i.id === id);
                return acc + item?.unitPrice * (quantities[id] || 1);
              }, 0)
              .toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            {t('common', 'cancel')}
          </button>
          <button
            disabled={selectedItems.length === 0 || submitting}
            onClick={handleSubmit}
            className="bg-primary text-white px-10 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common', 'submitting', 'Submitting...')}
              </>
            ) : (
              <>
                {t('returns', 'submitRequest', 'Submit Request')}{' '}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
