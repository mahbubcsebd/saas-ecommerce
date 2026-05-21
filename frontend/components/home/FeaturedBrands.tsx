'use client';

import { useTranslations } from '@/context/TranslationContext';
import { getLocalized } from '@/lib/utils';
import Link from 'next/link';

interface FeaturedBrandProps {
  brands: any[];
}

export default function FeaturedBrands({ brands }: FeaturedBrandProps) {
  const { t, locale } = useTranslations();

  if (!brands || brands.length === 0) return null;

  return (
    <section className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">
          {t('brands', 'featuredBrandsTitle', 'Featured Brands')}
        </h2>
        <Link href="/brands" className="text-primary hover:underline font-medium text-sm">
          {t('brands', 'seeAllBrands', 'See All Brands')}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {brands.map((brand) => {
          const localizedName = getLocalized(brand, locale, 'name') || brand.name;
          const productCount = brand._count?.products || 0;

          return (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="flex flex-col items-center justify-center p-6 bg-secondary/20 hover:bg-secondary/40 rounded-xl transition-colors gap-3 group"
            >
              <div className="w-16 h-16 flex items-center justify-center p-3 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={localizedName}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-lg font-black text-primary select-none uppercase italic">
                    {localizedName.slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-medium text-sm text-center line-clamp-1">{localizedName}</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {productCount} {productCount === 1
                    ? t('brands', 'product', 'Product')
                    : t('brands', 'products', 'Products')}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
