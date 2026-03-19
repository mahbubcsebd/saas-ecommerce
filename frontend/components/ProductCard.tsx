'use client';

import { useTranslations } from '@/context/TranslationContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/hooks/useCurrency';
import { trackAddToCart } from '@/lib/analytics';
import { cn, getLocalized } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types/product';
import { Eye, Heart, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import QuickViewModal from './products/QuickViewModal';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { t, locale } = useTranslations();
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const addToCart = useCartStore((state) => state.addToCart);

  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const localizedName = getLocalized(product, locale, 'name');
  const localizedDescription = getLocalized(product, locale, 'description');
  const localizedCategory =
    typeof product.category === 'object'
      ? getLocalized(product.category, locale, 'name')
      : product.category;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      await addToCart(product.id, 1);

      // Track AddToCart
      trackAddToCart({
        id: product.id,
        name: localizedName,
        price: product.sellingPrice,
        quantity: 1,
        category: localizedCategory,
      });

      toast.success(t('common', 'addedToCart', { defaultValue: 'Added to cart successfully!' }));
    } catch (error) {
      toast.error(t('common', 'failedToAddToCart', { defaultValue: 'Failed to add to cart' }));
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-lg',
        layout === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-muted/50',
          layout === 'list'
            ? 'w-full sm:w-[250px] aspect-[4/3] sm:aspect-auto'
            : 'aspect-[3/4] w-full'
        )}
      >
        <Link href={`/${product.slug}`} className="block h-full w-full">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes={
                layout === 'list'
                  ? '(max-width: 640px) 100vw, 250px'
                  : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground italic">
              {t('common', 'noImage', { defaultValue: 'No Image' })}
            </div>
          )}
        </Link>

        {/* Labels/Badges */}
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

        {/* Action Buttons (Hover) */}
        <div className="absolute right-2 top-2 z-20 flex flex-col gap-2 translate-x-12 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-primary hover:text-primary-foreground',
              isWishlisted ? 'text-red-500 fill-current' : 'text-muted-foreground'
            )}
            title={t('common', 'addToWishlist', { defaultValue: 'Add to Wishlist' })}
          >
            <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
          </button>
          <QuickViewModal product={product}>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-primary hover:text-primary-foreground text-muted-foreground"
              title={t('common', 'quickView', { defaultValue: 'Quick View' })}
            >
              <Eye className="h-5 w-5" />
            </button>
          </QuickViewModal>
        </div>
      </div>

      <div className={cn('p-4 flex flex-col flex-1', layout === 'list' && 'justify-between')}>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="outline" className="capitalize text-[10px] font-medium tracking-wide">
              {localizedCategory}
            </Badge>
            {layout === 'grid' && (
              <div className="flex flex-col items-end">
                <span className="text-base font-bold text-red-600">
                  {formatPrice(product.sellingPrice)}
                </span>
                {product.basePrice > product.sellingPrice && (
                  <span className="text-[10px] text-muted-foreground line-through opacity-70">
                    {formatPrice(product.basePrice)}
                  </span>
                )}
              </div>
            )}
          </div>
          <Link href={`/${product.slug}`} className="block group/title">
            <h3
              className={cn(
                'text-base font-semibold transition-colors group-hover/title:text-primary leading-tight mb-1',
                layout === 'grid' && 'line-clamp-1'
              )}
            >
              {localizedName}
            </h3>
          </Link>
          <p
            className={cn(
              'text-xs text-muted-foreground leading-relaxed',
              layout === 'grid' ? 'line-clamp-2' : 'line-clamp-3 mb-4'
            )}
          >
            {localizedDescription ? localizedDescription.replace(/<[^>]*>?/gm, '') : ''}
          </p>
        </div>

        <div
          className={cn(
            'mt-4 flex items-center justify-between gap-4',
            layout === 'list' && 'mt-auto'
          )}
        >
          {layout === 'list' && (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-red-600">
                {formatPrice(product.sellingPrice)}
              </span>
              {product.basePrice > product.sellingPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>
          )}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || isAddingToCart}
            className={cn(
              'shadow-sm transition-all active:scale-95',
              layout === 'list' ? 'w-auto px-8 h-10' : 'w-full h-9 text-xs'
            )}
          >
            {isAddingToCart ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5" />
                {t('common', 'addToCart', { defaultValue: 'Add to Cart' })}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
