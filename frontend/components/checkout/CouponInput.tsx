"use client";

import { useTranslations } from "@/context/TranslationContext";
import { useCurrency } from "@/hooks/useCurrency";
import { api } from '@/lib/api-client';
import { Loader2, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CouponInputProps {
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
  cart: any;
  country: string;
  appliedCoupon?: string;
}

export function CouponInput({
  onApply,
  onRemove,
  cart,
  country,
  appliedCoupon
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslations();
  const { formatPrice } = useCurrency();

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post<any>('/coupons/validate', {
        code,
        cart,
        country
      });

      if (!response) {
        setError(t('common', 'couponApplyError', { defaultValue: 'Failed to apply coupon' }));
        toast.error(t('common', 'invalidCoupon', { defaultValue: 'Invalid coupon code' }));
        return;
      }

      onApply(response.discount, code.toUpperCase());
      setCode('');
      toast.success(`${t('common', 'youSaved', { defaultValue: 'You saved' })} ${formatPrice(response.discount)}!`);

    } catch (err: any) {
      setError(err.message || t('common', 'couponApplyError', { defaultValue: 'Failed to apply coupon' }));
      toast.error(err.message || t('common', 'somethingWrong', { defaultValue: 'Something went wrong. Please try again.' }));
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
        <div className="flex items-center gap-2 text-green-700">
          <Tag size={18} />
          <span className="font-medium uppercase">{appliedCoupon} {t('common', 'applied', { defaultValue: 'applied' })}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-green-700 hover:text-green-900"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      <label className="text-sm font-medium">{t('common', 'couponCode', { defaultValue: 'Coupon Code' })}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('common', 'enterCoupon', { defaultValue: 'Enter coupon code' })}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background"
          disabled={loading}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {t('common', 'apply', { defaultValue: 'Apply' })}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
