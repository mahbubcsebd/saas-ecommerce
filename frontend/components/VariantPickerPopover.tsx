'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Product, ProductVariant } from '@/types/product';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface VariantPickerPopoverProps {
  product: Product;
  /** Currently only 'buynow' is used — Add to Cart auto-selects the first variant */
  mode: 'buynow';
  children: React.ReactNode;
}

/**
 * Wraps a Buy Now trigger in a Popover that lets the user pick a variant
 * before proceeding to checkout. Add-to-cart auto-selects the first variant
 * and does NOT use this component.
 */
export default function VariantPickerPopover({
  product,
  children,
}: VariantPickerPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProductVariant | null>(null);
  const [busy, setBusy] = useState(false);

  const setBuyNowItem = useCartStore((s) => s.setBuyNowItem);
  const { formatPrice } = useCurrency();

  const variants = (product.variants ?? []).filter((v) => v.isActive);

  /** Build a human-readable label from a variant's attributes */
  const getVariantLabel = (v: ProductVariant): string => {
    if (Array.isArray(v.attributes)) {
      const vals = v.attributes.map((a) => a.value).filter(Boolean);
      return vals.length > 0 ? vals.join(' / ') : v.name;
    }
    const vals = Object.values(v.attributes as Record<string, string>).filter(Boolean);
    return vals.length > 0 ? vals.join(' / ') : v.name;
  };

  const handleBuyNow = (selectedVariant: ProductVariant) => {
    setSelected(selectedVariant);
    setBusy(true);

    const variantSellingPrice = selectedVariant.sellingPrice ?? product.sellingPrice;
    const variantBasePrice = selectedVariant.basePrice ?? product.basePrice;

    setBuyNowItem({
      id: 'buy_now_temp',
      productId: product.id,
      quantity: 1,
      variantId: selectedVariant.id,
      variant: {
        name: selectedVariant.name,
        sellingPrice: variantSellingPrice,
        basePrice: variantBasePrice,
        images: selectedVariant.images?.length ? selectedVariant.images : undefined,
      },
      product: {
        name: product.name,
        images: product.images,
        slug: product.slug,
        stock: selectedVariant.stock > 0 ? selectedVariant.stock : product.stock,
        sellingPrice: product.sellingPrice,
        basePrice: product.basePrice,
      },
    });

    // We don't set busy to false because we're navigating away
    // and we want the spinner (if any) to stay while the page unloads.
    setOpen(false);
    router.push('/checkout');
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSelected(null);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-0 overflow-hidden" align="center" sideOffset={8}>
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a variant to continue
          </p>
        </div>

        {/* Variant list */}
        <div className="px-3 py-3 flex flex-col gap-2 max-h-60 overflow-y-auto">
          {variants.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No variants available
            </p>
          ) : (
            variants.map((v) => {
              const price = v.sellingPrice ?? product.sellingPrice;
              const isSelected = selected?.id === v.id;
              const outOfStock = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => handleBuyNow(v)}
                  className={cn(
                    'flex items-center justify-between w-full rounded-md px-3 py-2 text-sm border transition-all text-left',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50 hover:bg-accent',
                    outOfStock && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <span className="truncate">{getVariantLabel(v)}</span>
                  <div className="ml-2 shrink-0 flex flex-col items-end">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        isSelected ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {formatPrice(price)}
                    </span>
                    {outOfStock && (
                      <span className="text-[10px] text-destructive">Out of stock</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>


      </PopoverContent>
    </Popover>
  );
}
