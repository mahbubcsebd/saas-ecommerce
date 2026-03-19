'use client';

import { useTranslations } from '@/context/TranslationContext';
import { getLocalized } from '@/lib/utils';
import { Product } from '@/types/product';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface ProductBreadcrumbsProps {
  product: Product;
}

export default function ProductBreadcrumbs({ product }: ProductBreadcrumbsProps) {
  const { t, locale } = useTranslations();

  const categoryName =
    typeof product.category === 'object'
      ? getLocalized(product.category, locale, 'name')
      : product.category;
  const categorySlug =
    typeof product.category === 'object' ? (product.category as any).slug : 'all'; // Fallback to all if slug is not available
  const productName = getLocalized(product, locale, 'name');

  return (
    <nav className="flex text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
      <Link href="/" className="flex items-center hover:text-primary transition-colors">
        <Home className="h-4 w-4 mr-1" />
        {t('common', 'home', { defaultValue: 'Home' })}
      </Link>
      <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
      <Link
        href={`/products?category=${categorySlug}`}
        className="hover:text-primary transition-colors capitalize px-1"
      >
        {categoryName}
      </Link>
      <ChevronRight className="h-4 w-4 mx-2 flex-shrink-0" />
      <span
        className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none px-1"
        title={productName}
      >
        {productName}
      </span>
    </nav>
  );
}
