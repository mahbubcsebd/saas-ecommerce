'use client';

import { useTranslations } from '@/context/TranslationContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/hooks/useCurrency';
import { trackAddToCart } from '@/lib/analytics';
import { cn, getLocalized, getImageUrl } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types/product';
import { Eye, Heart, ShoppingCart, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import VariantPickerPopover from './VariantPickerPopover';
import QuickViewModal from './products/QuickViewModal';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const { t, locale } = useTranslations();
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const addToCart = useCartStore((state) => state.addToCart);
  const setBuyNowItem = useCartStore((s) => s.setBuyNowItem);
  const cart = useCartStore((s) => s.cart);

  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const localizedName = getLocalized(product, locale, 'name');
  const localizedDescription = getLocalized(product, locale, 'description');
  const localizedCategory =
    typeof product.category === 'object'
      ? getLocalized(product.category, locale, 'name')
      : product.category;

  // Active variants only
  const activeVariants = (product.variants ?? []).filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;
  const firstVariant = activeVariants[0];

  // Brand name — shown always instead of category
  const brandName = product.brandRel?.name ?? (product.brand as string | undefined);
  const badgeLabel = brandName ?? localizedCategory;

  // Is this product (any variant) already in the cart?
  const isInCart = (cart?.items || []).some((item) => item.productId === product.id);

  /* ── Add to Cart — auto-selects first variant, no popup ───── */
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      // Auto-select the first active variant (if any)
      await addToCart(product.id, 1, hasVariants ? firstVariant?.id : undefined);
      trackAddToCart({
        id: product.id,
        name: localizedName,
        price: product.sellingPrice,
        quantity: 1,
        category: localizedCategory,
      });
      toast.success(t('common', 'addedToCart', { defaultValue: 'Added to cart successfully!' }));
    } catch {
      toast.error(t('common', 'failedToAddToCart', { defaultValue: 'Failed to add to cart' }));
    } finally {
      setIsAddingToCart(false);
    }
  };

  /* ── Buy Now (no variant) ─────────────────────────────────── */
  const handleDirectBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBuyNowItem({
      id: 'buy_now_temp',
      productId: product.id,
      quantity: 1,
      product: {
        name: product.name,
        images: product.images,
        slug: product.slug,
        stock: product.stock,
        sellingPrice: product.sellingPrice,
        basePrice: product.basePrice,
      },
    });
    router.push('/checkout');
  };

  /* ── Price block ─────────────────────────────────────────── */
  const PriceBlock = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => (
    <div className="flex flex-col items-end shrink-0">
      <span className={cn('font-bold text-red-600', size === 'lg' ? 'text-xl' : 'text-sm')}>
        {formatPrice(product.sellingPrice)}
      </span>
      {product.basePrice > product.sellingPrice && (
        <span
          className={cn(
            'text-muted-foreground line-through opacity-70',
            size === 'lg' ? 'text-sm' : 'text-[10px]',
          )}
        >
          {formatPrice(product.basePrice)}
        </span>
      )}
    </div>
  );

  /* ── Grid card ───────────────────────────────────────────── */
  if (layout === 'grid') {
    return (
      <div className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 flex flex-col">

        {/* Image — 275px desktop, proportional smaller */}
        <div className="relative overflow-hidden bg-muted/50 h-[180px] sm:h-[220px] lg:h-[275px] w-full">
          <Link href={`/${product.slug}`} className="block h-full w-full">
            {product.images && product.images.length > 0 ? (
              <Image
                src={getImageUrl(product.images[0])}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground italic text-xs">
                {t('common', 'noImage', { defaultValue: 'No Image' })}
              </div>
            )}
          </Link>

          {/* Discount / stock badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {(product.discounts && product.discounts.length > 0) || product.discount ? (
              <Badge variant="destructive" className="bg-red-600 font-bold px-1.5 py-0 text-[10px]">
                {product.discount?.type === 'PERCENTAGE'
                  ? `-${product.discount.value}%`
                  : product.discount?.type === 'FLAT'
                    ? `-${formatPrice(product.discount.value)}`
                    : t('common', 'sale', { defaultValue: 'SALE' })}
              </Badge>
            ) : null}
            {product.stock <= 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                {t('common', 'outOfStock', { defaultValue: 'Out of Stock' })}
              </Badge>
            )}
          </div>

          {/* Hover action icons */}
          <div className="absolute right-2 top-2 z-20 flex flex-col gap-1.5 translate-x-12 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
            <button
              onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isWishlisted ? 'text-red-500' : 'text-muted-foreground',
              )}
              aria-label={t('common', 'addToWishlist', { defaultValue: 'Add to Wishlist' })}
            >
              <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
            </button>
            <QuickViewModal product={product}>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-primary hover:text-primary-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={t('common', 'quickView', { defaultValue: 'Quick View' })}
              >
                <Eye className="h-4 w-4" />
              </button>
            </QuickViewModal>
          </div>
        </div>

        {/* Card body */}
        <div className="p-2.5 flex flex-col flex-1">
          {/* Brand badge + Price */}
          <div className="mb-1.5 flex items-start justify-between gap-1">
            <Badge
              variant="outline"
              className="capitalize text-[9px] font-medium tracking-wide px-1.5 py-0 shrink-0"
            >
              {badgeLabel}
            </Badge>
            <PriceBlock size="sm" />
          </div>

          {/* Product name */}
          <Link
            href={`/${product.slug}`}
            className="block group/title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
          >
            <h3 className="text-sm font-semibold transition-colors group-hover/title:text-primary leading-snug line-clamp-2 mb-1">
              {localizedName}
            </h3>
          </Link>

          <div className="flex-1" />

          {/* Action buttons */}
          <div className="mt-2 flex gap-1.5">
            {/*
              Add to Cart — icon only.
              Products WITH variants: auto-adds first variant (no popup).
              Products WITHOUT variants: direct add.
              Icon is FILLED when this product is already in cart.
            */}
            <Button
              variant="outline"
              size="icon"
              disabled={product.stock <= 0 || isAddingToCart}
              className="h-8 w-8 shrink-0 shadow-sm transition active:scale-95"
              aria-label={t('common', 'addToCart', { defaultValue: 'Add to Cart' })}
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <ShoppingCart
                  className={cn('h-3.5 w-3.5', isInCart && 'fill-current')}
                />
              )}
            </Button>

            {/*
              Buy Now — full text.
              Products WITH variants: opens picker popup.
              Products WITHOUT variants: direct buy now.
            */}
            {hasVariants ? (
              <VariantPickerPopover product={product} mode="buynow">
                <Button
                  size="sm"
                  disabled={product.stock <= 0}
                  className="flex-1 h-8 text-xs shadow-sm transition active:scale-95 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Zap className="h-3 w-3" />
                  {t('common', 'buyNow', { defaultValue: 'Buy Now' })}
                </Button>
              </VariantPickerPopover>
            ) : (
              <Button
                size="sm"
                disabled={product.stock <= 0}
                className="flex-1 h-8 text-xs shadow-sm transition active:scale-95 gap-1"
                onClick={handleDirectBuyNow}
              >
                <Zap className="h-3 w-3" />
                {t('common', 'buyNow', { defaultValue: 'Buy Now' })}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── List card ───────────────────────────────────────────── */
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition hover:shadow-lg focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 flex flex-col sm:flex-row">
      {/* Image */}
      <div className="relative overflow-hidden bg-muted/50 w-full sm:w-[220px] aspect-[4/3] sm:aspect-auto sm:h-[220px]">
        <Link href={`/${product.slug}`} className="block h-full w-full">
          {product.images && product.images.length > 0 ? (
            <Image
              src={getImageUrl(product.images[0])}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, 220px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground italic">
              {t('common', 'noImage', { defaultValue: 'No Image' })}
            </div>
          )}
        </Link>

        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {(product.discounts && product.discounts.length > 0) || product.discount ? (
            <Badge variant="destructive" className="bg-red-600 font-bold px-2 py-0.5">
              {product.discount?.type === 'PERCENTAGE'
                ? `-${product.discount.value}%`
                : product.discount?.type === 'FLAT'
                  ? `-${formatPrice(product.discount.value)}`
                  : t('common', 'sale', { defaultValue: 'SALE' })}
            </Badge>
          ) : null}
          {product.stock <= 0 && (
            <Badge variant="destructive" className="px-2 py-0.5">
              {t('common', 'outOfStock', { defaultValue: 'Out of Stock' })}
            </Badge>
          )}
        </div>

        <div className="absolute right-2 top-2 z-20 flex flex-col gap-2 translate-x-12 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isWishlisted ? 'text-red-500' : 'text-muted-foreground',
            )}
          >
            <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
          </button>
          <QuickViewModal product={product}>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-primary hover:text-primary-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Eye className="h-5 w-5" />
            </button>
          </QuickViewModal>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="capitalize text-[10px] font-medium tracking-wide">
              {badgeLabel}
            </Badge>
          </div>
          <Link href={`/${product.slug}`} className="block group/title focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm">
            <h3 className="text-base font-semibold transition-colors group-hover/title:text-primary leading-tight mb-1">
              {localizedName}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
            {localizedDescription ? localizedDescription.replace(/<[^>]*>?/gm, '') : ''}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 mt-auto">
          <PriceBlock size="lg" />
          <div className="flex gap-2">
            {/* Cart icon (filled if in cart) */}
            <Button
              variant="outline"
              size="icon"
              disabled={product.stock <= 0 || isAddingToCart}
              className="h-10 w-10 shadow-sm transition active:scale-95"
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <ShoppingCart className={cn('h-4 w-4', isInCart && 'fill-current')} />
              )}
            </Button>

            {/* Buy Now */}
            {hasVariants ? (
              <VariantPickerPopover product={product} mode="buynow">
                <Button
                  disabled={product.stock <= 0}
                  className="h-10 px-6 shadow-sm transition active:scale-95 gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Zap className="h-4 w-4" />
                  {t('common', 'buyNow', { defaultValue: 'Buy Now' })}
                </Button>
              </VariantPickerPopover>
            ) : (
              <Button
                disabled={product.stock <= 0}
                className="h-10 px-6 shadow-sm transition active:scale-95 gap-1.5"
                onClick={handleDirectBuyNow}
              >
                <Zap className="h-4 w-4" />
                {t('common', 'buyNow', { defaultValue: 'Buy Now' })}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
