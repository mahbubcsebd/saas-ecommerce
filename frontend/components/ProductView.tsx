'use client';

import { useTranslations } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductHeader from './products/ProductHeader';

interface ProductViewProps {
  products: Product[];
}

export default function ProductView({ products }: ProductViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { locale } = useTranslations();

  // Get current sort from URL or default
  const currentSort = searchParams.get('sort') || 'newest';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <ProductHeader total={products.length} view={view} onViewChange={setView} />

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No products found matching your filters.
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-6',
            view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} layout={view} />
          ))}
        </div>
      )}
    </div>
  );
}
