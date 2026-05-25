'use client';

import { useTranslations } from '@/context/TranslationContext';
import { Product } from '@/types/product';
import Link from 'next/link';
import ProductCard from '../ProductCard';

interface NewArrivalsProps {
  products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
  const { t } = useTranslations();
  if (!products || products.length === 0) return null;

  return (
    <section className="container py-12 bg-secondary/5">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">{t('home', 'newArrivals', 'New Arrivals')}</h2>
        <Link href="/products?sort=createdAt_desc" className="text-primary hover:underline">
          {t('common', 'viewAll', 'View All')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
