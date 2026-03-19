'use client';

import { useTranslations } from '@/context/TranslationContext';
import { useCartStore } from '@/store/useCartStore';
import { useState } from 'react';
import CheckoutForm from './CheckoutForm';
import OrderReview from './OrderReview';

interface CheckoutPageContentProps {
  session: any;
  initialAddress: any;
}

export default function CheckoutPageContent({ session, initialAddress }: CheckoutPageContentProps) {
  const { cart, loading: cartLoading, selectedItemIds, buyNowItem } = useCartStore();
  const { t } = useTranslations();
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [shippingOption, setShippingOption] = useState<any>(null);

  if (cartLoading)
    return <div className="p-20 text-center">{t('common', 'loadingCart', 'Loading cart...')}</div>;

  // Determine which items to process
  // 1. Priority to immediate Buy Now
  // 2. Fallback to explicitly selected cart items
  let checkoutItems: any[] = [];

  if (buyNowItem) {
    checkoutItems = [buyNowItem];
  } else if (cart && cart.items.length > 0) {
    checkoutItems = cart.items.filter((item) => selectedItemIds.includes(item.id));
    if (checkoutItems.length === 0) {
      checkoutItems = [...cart.items];
    }
  }

  // If both fallbacks fail, block progress logically.
  if (checkoutItems.length === 0) {
    return (
      <div className="p-20 text-center">
        {t(
          'common',
          'noItemsSelected',
          'No items selected for checkout. Please return to the cart.'
        )}
      </div>
    );
  }

  const subtotal = checkoutItems.reduce((acc, item) => {
    const price = item.variant?.sellingPrice || item.product.sellingPrice;
    return acc + price * item.quantity;
  }, 0);

  const cartWeight = checkoutItems.reduce((acc, item) => {
    const w = item.product?.weight || 0.5;
    return acc + w * item.quantity;
  }, 0);

  const initialData = {
    firstName: initialAddress?.name?.split(' ')[0] || session?.user?.name?.split(' ')[0] || '',
    lastName:
      initialAddress?.name?.split(' ').slice(1).join(' ') ||
      session?.user?.name?.split(' ').slice(1).join(' ') ||
      '',
    email: session?.user?.email || '',
    phone: initialAddress?.phone || session?.user?.phone || '',
    street: initialAddress?.street || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    zipCode: initialAddress?.zipCode || '',
  };

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t('common', 'checkout', 'Checkout')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">
              {t('common', 'shippingDetails', 'Shipping Details')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {session
                ? t('common', 'reviewDetails', 'Review your details')
                : t('common', 'enterShippingInfo', 'Enter your shipping information')}
            </p>
          </div>

          <CheckoutForm
            initialData={initialData}
            subtotal={subtotal}
            cartWeight={cartWeight}
            discount={discount}
            couponCode={couponCode}
            shippingOption={shippingOption}
            setShippingOption={setShippingOption}
            checkoutItems={checkoutItems}
            isBuyNow={!!buyNowItem}
          />
        </div>

        <OrderReview
          cartItems={checkoutItems}
          subtotal={subtotal}
          discount={discount}
          couponCode={couponCode}
          shippingCost={shippingOption?.cost || 0}
          onApplyCoupon={(d, c) => {
            setDiscount(d);
            setCouponCode(c);
          }}
          onRemoveCoupon={() => {
            setDiscount(0);
            setCouponCode('');
          }}
          session={session}
          isBuyNow={!!buyNowItem}
        />
      </div>
    </div>
  );
}
