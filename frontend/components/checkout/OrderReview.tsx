"use client";

import { useSettings } from "@/context/SettingsContext";
import { useTranslations } from "@/context/TranslationContext";
import { useCurrency } from "@/hooks/useCurrency";
import Image from "next/image";
import { CouponInput } from "./CouponInput";

interface OrderReviewProps {
  cartItems: any[];
  subtotal: number;
  discount: number;
  couponCode: string;
  shippingCost: number;
  onApplyCoupon: (discount: number, code: string) => void;
  onRemoveCoupon: () => void;
  session: any;
  isBuyNow: boolean;
}

export default function OrderReview({
  cartItems,
  subtotal,
  discount,
  couponCode,
  shippingCost,
  onApplyCoupon,
  onRemoveCoupon,
  session,
  isBuyNow
}: OrderReviewProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslations();
  const { settings } = useSettings();

  const isTaxEnabled = settings?.tax?.isTaxEnabled || false;
  const codExtraCharge = settings?.payment?.codExtraCharge || 0;

  // For now we'll assume a default VAT if not specified in product
  // but many shops have it set to 0 by default.
  // The user requested to add it.
  const vatPercent = isTaxEnabled ? 5 : 0; // Example 5% or get from product
  const afterDiscount = subtotal - discount;
  const vatAmount = (afterDiscount * vatPercent) / 100;

  // Final total including extra charges
  const finalTotal = Math.max(0, subtotal + shippingCost - discount + vatAmount + codExtraCharge);

  return (
    <div className="rounded-lg border bg-card p-6 sticky top-20">
      <h2 className="text-xl font-semibold mb-4">{t('common', 'yourOrder', { defaultValue: 'Your Order' })} {isBuyNow && <span className="text-xs ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full">Buy Now</span>}</h2>
      <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
        {cartItems.map((item: any) => {
          const price = item.variant?.sellingPrice || item.product.sellingPrice;
          const displayImage = item.variant?.images?.[0] || item.product.images?.[0];
          return (
            <div key={item.id} className="flex gap-4 text-sm border-b pb-4 last:border-0 last:pb-0">
              <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded bg-muted">
                {displayImage && (
                  <Image
                    src={displayImage}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="font-medium flex-1 flex flex-col justify-between">
                <div>
                  <p className="line-clamp-2 leading-snug">{item.product.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Variant: {item.variant.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-2">
                    <span>{formatPrice(price)}</span>
                    <span className="text-[10px]">×</span>
                    <span>{item.quantity}</span>
                    <span className="text-[10px]">=</span>
                    <span className="font-bold text-foreground">{formatPrice(price * item.quantity)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <CouponInput
        cart={{
          items: cartItems.map((item: any) => ({
            productId: item.productId,
            categoryId: item.product.categoryId,
            price: item.variant?.sellingPrice || item.product.sellingPrice,
            quantity: item.quantity
          })),
          subtotal: subtotal,
          userId: session?.user?.id || "",
          country: "BD"
        }}
        country="BD"
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
        appliedCoupon={couponCode}
      />

      <div className="border-t pt-4 mt-6 space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{t('common', 'subtotal', { defaultValue: 'Subtotal' })}</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>{t('common', 'discount', { defaultValue: 'Discount' })} ({couponCode})</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-muted-foreground">
          <span>{t('common', 'shipping', { defaultValue: 'Shipping' })}</span>
          <span className="font-medium text-foreground">
            {shippingCost > 0 ? formatPrice(shippingCost) : <span className="text-xs">{t('common', 'calculatedAtCheckout', { defaultValue: 'Calculated at checkout' })}</span>}
          </span>
        </div>

        {isTaxEnabled && vatAmount > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t('common', 'vat', { defaultValue: 'VAT/Tax' })} ({vatPercent}%)</span>
              <span className="font-medium text-foreground">{formatPrice(vatAmount)}</span>
            </div>
        )}

        {codExtraCharge > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>COD Extra Charge</span>
              <span className="font-medium text-foreground">{formatPrice(codExtraCharge)}</span>
            </div>
        )}

        <div className="border-t pt-3 mt-3 flex justify-between items-center text-lg font-bold">
          <span>{t('common', 'total', { defaultValue: 'Total' })}</span>
          <span className="text-primary">{formatPrice(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}
