import { useTranslations } from '@/context/TranslationContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/hooks/useCurrency';
import { cn, getLocalized } from '@/lib/utils';
import { Product } from '@/types/product';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

  const isWishlisted = isInWishlist(product.id);
  const localizedName = getLocalized(product, locale, 'name');
  const localizedDescription = getLocalized(product, locale, 'description');
  const localizedCategory = typeof product.category === 'object' ? getLocalized(product.category, locale, 'name') : product.category;

  return (
    <div
        className={cn(
            "group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md",
            layout === 'list' ? "flex flex-col sm:flex-row" : "flex flex-col"
        )}
    >
      <Link
        href={`/${product.slug}`}
        className={cn(
            "block relative overflow-hidden bg-muted/50",
            layout === 'list'
                ? "w-full sm:w-[250px] aspect-[4/3] sm:aspect-auto"
                : "aspect-[3/4] w-full"
        )}
      >
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes={layout === 'list' ? "(max-width: 640px) 100vw, 250px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          />
        ) : (
             <div className="flex h-full items-center justify-center text-muted-foreground">
                {t('common', 'noImage', { defaultValue: 'No Image' })}
            </div>
        )}
        {(product.discounts && product.discounts.length > 0) || product.discount ? (
            <div className="absolute top-2 left-2 z-10">
                <Badge variant="destructive" className="bg-red-600 font-bold">
                    {/* Display the best discount if multiple exists, or just the primary one */}
                    {product.discount?.type === 'PERCENTAGE'
                        ? `-${product.discount.value}%`
                        : product.discount?.type === 'FLAT'
                            ? `-${formatPrice(product.discount.value)}`
                            : t('common', 'sale', { defaultValue: 'SALE' })}
                </Badge>
            </div>
        ) : null}
        {product.stock <= 0 && (
            <div className="absolute top-2 right-2 z-10">
                <Badge variant="destructive">{t('common', 'outOfStock', { defaultValue: 'Out of Stock' })}</Badge>
            </div>
        )}

        {/* Wishlist Button */}
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
            }}
            className={cn(
                "absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background",
                isWishlisted ? "text-red-500 shadow-sm" : "text-muted-foreground"
            )}
        >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
        </button>
      </Link>
      <div className={cn("p-4 flex flex-col flex-1", layout === 'list' && "justify-between")}>
        <div>
            <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="capitalize">
                    {localizedCategory}
                </Badge>
                {layout === 'grid' && (
                <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-red-600">{formatPrice(product.sellingPrice)}</span>
                        {product.basePrice > product.sellingPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.basePrice)}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <Link href={`/${product.slug}`} className="block">
                <h3 className={cn("text-lg font-medium group-hover:underline", layout === 'grid' && "line-clamp-1")}>
                {localizedName}
                </h3>
            </Link>
            <p className={cn("mt-1 text-sm text-muted-foreground", layout === 'grid' ? "line-clamp-2" : "line-clamp-3 mb-4")}>
            {localizedDescription ? localizedDescription.replace(/<[^>]*>?/gm, "") : ""}
            </p>
            {product.variants && product.variants.length > 0 && (
              <p className="text-xs text-primary mt-1">
                {product.variants.length} {product.variants.length > 1 ? t('common', 'variantsAvailable') : t('common', 'variantAvailable')}
              </p>
            )}
        </div>

        <div className={cn("mt-4 flex items-center justify-between gap-4", layout === 'list' && "mt-auto")}>
            {layout === 'list' && (
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-red-600">{formatPrice(product.sellingPrice)}</span>
                    {product.basePrice > product.sellingPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.basePrice)}
                        </span>
                    )}
                </div>
            )}
            <Button className={cn(layout === 'list' ? "w-auto px-8" : "w-full")}>{t('common', 'addToCart', { defaultValue: 'Add to Cart' })}</Button>
        </div>
      </div>
    </div>
  );
}
