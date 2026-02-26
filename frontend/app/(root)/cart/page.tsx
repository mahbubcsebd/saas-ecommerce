"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/context/TranslationContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/lib/cart-context";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { cart, loading, removeFromCart, updateQuantity } = useCart();
  const { t } = useTranslations();
  const { formatPrice } = useCurrency();

  if (loading) return <div className="container py-10">{t('common', 'loadingCart', { defaultValue: 'Loading cart...' })}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">{t('common', 'cartEmpty', { defaultValue: 'Your Cart is Empty' })}</h2>
        <p className="text-muted-foreground">{t('common', 'cartEmptyDesc', { defaultValue: "Looks like you haven't added anything yet." })}</p>
        <Button asChild>
          <Link href="/">{t('common', 'continueShopping', { defaultValue: 'Continue Shopping' })}</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cart.items.reduce((acc, item) => {
    const price = item.variant?.sellingPrice || item.product.sellingPrice;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">{t('common', 'shoppingCart', { defaultValue: 'Shopping Cart' })}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const displayImage = item.variant?.images?.[0] || item.product.images?.[0];
            const displayPrice = item.variant?.sellingPrice || item.product.sellingPrice;
            const displayBasePrice = item.variant?.basePrice || item.product.basePrice;

            return (
            <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-card">
              <Link href={`/products/${item.product.slug}`} className="relative w-24 h-24 shrink-0 overflow-hidden rounded-md border bg-muted group-hover:opacity-90 transition-opacity">
                 {displayImage && (
                    <Image
                        src={displayImage}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                    />
                 )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                    <Link href={`/products/${item.product.slug}`} className="hover:text-primary transition-colors">
                        <h3 className="font-semibold">{item.product.name}</h3>
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Variant: {item.variant.name}
                      </p>
                    )}
                    <div className="mt-1">
                      <span className="text-sm font-semibold">{formatPrice(displayPrice)}</span>
                      {displayBasePrice > displayPrice && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          {formatPrice(displayBasePrice)}
                        </span>
                      )}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 border rounded-md">
                        <button
                            className="p-1 hover:bg-accent rounded-l-md disabled:opacity-50"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                            className="p-1 hover:bg-accent rounded-r-md disabled:opacity-50"
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             disabled={item.quantity >= item.product.stock}
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart(item.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
             <div className="rounded-lg border bg-card p-6 shadow-sm sticky top-20">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('common', 'subtotal', { defaultValue: 'Subtotal' })}</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('common', 'shipping', { defaultValue: 'Shipping' })}</span>
                        <span>{t('common', 'shippingCalculated', { defaultValue: 'Calculated at checkout' })}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                        <span>{t('common', 'total', { defaultValue: 'Total' })}</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                </div>

                <Button className="w-full" size="lg" asChild>
                    <Link href="/checkout">{t('common', 'proceedToCheckout', { defaultValue: 'Proceed to Checkout' })}</Link>
                </Button>
             </div>
        </div>
      </div>
    </div>
  );
}
