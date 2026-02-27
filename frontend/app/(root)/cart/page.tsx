"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/context/TranslationContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const { cart, loading, removeFromCart, updateQuantity, selectedItemIds, toggleSelectItem, selectAllItems, clearCart } = useCartStore();
  const { t } = useTranslations();
  const { formatPrice } = useCurrency();

  // Auto-select all items when cart initially loads and no items are selected
  useEffect(() => {
    if (cart && cart.items.length > 0 && selectedItemIds.length === 0) {
      selectAllItems(cart.items.map(item => item.id));
    }
  }, [cart, selectedItemIds, selectAllItems]);

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

  // Calculate subtotal ONLY for selected items
  const subtotal = cart.items
    .filter(item => selectedItemIds.includes(item.id))
    .reduce((acc, item) => {
      const price = item.variant?.sellingPrice || item.product.sellingPrice;
      return acc + (price * item.quantity);
    }, 0);

  const allSelected = cart.items.length > 0 && selectedItemIds.length === cart.items.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllItems(cart.items.map(item => item.id));
    } else {
      selectAllItems([]);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('common', 'shoppingCart', { defaultValue: 'Shopping Cart' })}</h1>

        {cart.items.length > 0 && (
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Checkbox
                   id="select-all"
                   checked={allSelected}
                   onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All
                </label>
             </div>
             <Button
                variant="destructive"
                size="sm"
                onClick={clearCart}
                className="h-8 group"
             >
               <Trash2 className="w-3.5 h-3.5 mr-2 group-hover:animate-pulse" />
               Clear All
             </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const displayImage = item.variant?.images?.[0] || item.product.images?.[0];
            const displayPrice = item.variant?.sellingPrice || item.product.sellingPrice;
            const displayBasePrice = item.variant?.basePrice || item.product.basePrice;
            const displayStock = (item.variant ? (item.variant as any).stock : item.product.stock) || 0;
            const isSelected = selectedItemIds.includes(item.id);

            return (
            <div
              key={item.id}
              className="flex items-center gap-4 py-4 px-2 hover:bg-muted/30 transition-colors border-b last:border-0 relative cursor-pointer"
              onClick={() => toggleSelectItem(item.id)}
            >
              {/* Checkbox (Left side aligned) */}
              <div className="flex items-center self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                 <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                 />
              </div>

              {/* Product Image */}
              <Link href={`/products/${item.product.slug}`} onClick={(e) => e.stopPropagation()} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted group-hover:opacity-90 transition-opacity">
                 {displayImage && (
                    <Image
                        src={displayImage}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                    />
                 )}
              </Link>

              {/* Product Details (Middle Section) */}
              <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Info */}
                <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                    <Link href={`/products/${item.product.slug}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors text-sm font-medium line-clamp-2 w-fit">
                        {item.product.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        Variant: {item.variant.name}
                      </p>
                    )}
                    <div className="flex items-center text-sm font-medium gap-2 mt-1">
                      <span>{formatPrice(displayPrice)}</span>
                      {displayBasePrice > displayPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(displayBasePrice)}
                        </span>
                      )}
                    </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-background"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                        type="number"
                        min={1}
                        max={displayStock}
                        value={item.quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            if (val > displayStock) {
                               toast.error(`Only ${displayStock} available in stock for this item.`);
                            }
                            updateQuantity(item.id, Math.min(Math.max(1, val), displayStock));
                        }}
                        className="h-8 w-12 text-center text-sm font-medium px-0 border-x-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-none focus-visible:ring-0"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md bg-background"
                        onClick={() => {
                           if (item.quantity >= displayStock) {
                              toast.error(`Only ${displayStock} available in stock.`);
                           } else {
                              updateQuantity(item.id, item.quantity + 1);
                           }
                        }}
                        disabled={item.quantity >= displayStock}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                {/* Subtotal & Delete */}
                <div className="flex items-center justify-end gap-4 min-w-[100px] shrink-0">
                   <span className="font-semibold text-base">{formatPrice(displayPrice * item.quantity)}</span>

                   <Button
                       variant="ghost"
                       size="icon"
                       className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 -mr-2"
                       onClick={(e) => {
                         e.stopPropagation();
                         removeFromCart(item.id);
                       }}
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
                        <span className="text-muted-foreground">{t('common', 'subtotal', { defaultValue: 'Subtotal' })} ({selectedItemIds.length} items)</span>
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

                <Button className="w-full" size="lg" disabled={selectedItemIds.length === 0} asChild={selectedItemIds.length > 0}>
                    {selectedItemIds.length > 0 ? (
                        <Link href="/checkout">{t('common', 'proceedToCheckout', { defaultValue: 'Proceed to Checkout' })}</Link>
                    ) : (
                        <span>Select items to checkout</span>
                    )}
                </Button>
             </div>
        </div>
      </div>
    </div>
  );
}
