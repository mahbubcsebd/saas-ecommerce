'use client';

import { createOrderAction } from '@/actions/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/context/SettingsContext';
import { useTranslations } from '@/context/TranslationContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useCartStore } from '@/store/useCartStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { ShippingOption, ShippingOptions } from './ShippingOptions';

const guestSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone number required'),
  street: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  zipCode: z.string().min(4, 'Zip Code is required'),
});

type GuestFormValues = z.infer<typeof guestSchema>;

interface CheckoutFormProps {
  initialData: Partial<GuestFormValues>;
  subtotal: number;
  cartWeight: number;
  discount: number;
  couponCode: string;
  shippingOption: ShippingOption | null;
  setShippingOption: (option: ShippingOption | null) => void;
  checkoutItems: any[];
  isBuyNow: boolean;
}

export default function CheckoutForm({
  initialData,
  subtotal,
  cartWeight,
  discount,
  couponCode,
  shippingOption,
  setShippingOption,
  checkoutItems,
  isBuyNow,
}: CheckoutFormProps) {
  const { t } = useTranslations();
  const { formatPrice } = useCurrency();
  const { settings } = useSettings();
  const { clearCart, guestId, setBuyNowItem } = useCartStore();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(createOrderAction, {
    success: false,
    message: '',
  });

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      street: initialData.street || '',
      city: initialData.city || '',
      state: initialData.state || '',
      zipCode: initialData.zipCode || '',
    },
  });

  useEffect(() => {
    if (state.success && state.orderId) {
      toast.success(state.message);

      // If buy now, we clear the temporary buy now state.
      // If it's a regular cart checkout, we should technically only clear the *selected* items.
      // But for now, we'll clear the buy_now state globally. The backend handles the cart clearing.
      setBuyNowItem(null);

      router.push(`/orders/success?orderId=${state.orderId}`);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, clearCart, setBuyNowItem, router]);

  const handleCustomSubmit = (data: GuestFormValues) => {
    if (!shippingOption) {
      toast.warning(t('common', 'selectShippingMethod', 'Please select a shipping method.'));
      return;
    }

    const orderData = {
      sessionId: guestId,
      orderItems: checkoutItems.map((item) => {
        const price = item.variant?.sellingPrice || item.product.sellingPrice;
        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: price,
          id: item.id, // Pass the cart item ID to let the backend know exactly which items to clear
        };
      }),
      guestInfo: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
      },
      shippingAddress: {
        street: data.street,
        city: data.city,
        state: data.state || '',
        zipCode: data.zipCode,
        country: 'BD',
      },
      paymentMethod: 'COD',
      shippingCost: shippingOption.cost,
      shippingMethod: shippingOption.method,
      shippingZoneId: shippingOption.zoneId,
      shippingRateId: shippingOption.id,
      discountAmount: discount,
      appliedCoupon: couponCode,
      vatPercent: settings?.tax?.isTaxEnabled ? 5 : 0, // Match OrderReview calculation
      vatAmount: ((subtotal - discount) * (settings?.tax?.isTaxEnabled ? 5 : 0)) / 100,
      codExtraCharge: settings?.payment?.codExtraCharge || 0,

      // Flags for the backend route
      isBuyNow: isBuyNow,
    };

    // Trigger Server Action
    formAction(orderData);
  };

  const shippingCost = shippingOption?.cost || 0;
  const total = Math.max(0, subtotal + shippingCost - discount);

  return (
    <form onSubmit={form.handleSubmit(handleCustomSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            {t('common', 'firstName', { defaultValue: 'First Name' })}
          </Label>
          <Input id="firstName" {...form.register('firstName')} disabled={isPending} />
          {form.formState.errors.firstName && (
            <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('common', 'lastName', { defaultValue: 'Last Name' })}</Label>
          <Input id="lastName" {...form.register('lastName')} disabled={isPending} />
          {form.formState.errors.lastName && (
            <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('common', 'email', { defaultValue: 'Email' })}</Label>
        <Input id="email" type="email" {...form.register('email')} disabled={isPending} />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t('common', 'phone', { defaultValue: 'Phone' })}</Label>
        <Input id="phone" {...form.register('phone')} disabled={isPending} />
        {form.formState.errors.phone && (
          <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">{t('common', 'address', { defaultValue: 'Address' })}</Label>
        <Input id="street" {...form.register('street')} disabled={isPending} />
        {form.formState.errors.street && (
          <p className="text-xs text-destructive">{form.formState.errors.street.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">{t('common', 'city', { defaultValue: 'City' })}</Label>
          <Input id="city" {...form.register('city')} disabled={isPending} />
          {form.formState.errors.city && (
            <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">{t('common', 'state', { defaultValue: 'State' })}</Label>
          <Input id="state" {...form.register('state')} disabled={isPending} />
          {form.formState.errors.state && (
            <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">{t('common', 'zipCode', { defaultValue: 'Zip Code' })}</Label>
          <Input id="zipCode" {...form.register('zipCode')} disabled={isPending} />
          {form.formState.errors.zipCode && (
            <p className="text-xs text-destructive">{form.formState.errors.zipCode.message}</p>
          )}
        </div>
      </div>

      <ShippingOptions
        cartTotal={subtotal}
        cartWeight={cartWeight}
        onSelect={setShippingOption}
        selectedId={shippingOption?.id}
      />

      <Button type="submit" size="lg" className="w-full mt-6" disabled={isPending}>
        {isPending
          ? t('common', 'processing', 'Processing...')
          : `${t('common', 'placeOrder', 'Place Order')} - ${formatPrice(total)}`}
      </Button>
    </form>
  );
}
