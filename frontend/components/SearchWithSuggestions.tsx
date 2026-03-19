'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from '@/context/TranslationContext';
import { useDebounce } from '@/hooks/use-debounce';
import { useCurrency } from '@/hooks/useCurrency';
import { getLocalized } from '@/lib/utils';
import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  basePrice: number;
  images: string[];
  discountAmount: number;
  translations?: any[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  products_count?: number;
  translations?: any[];
}

export default function SearchWithSuggestions() {
  const { t, locale } = useTranslations();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setProducts([]);
        setCategories([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

        // Fetch Products
        const prodRes = await fetch(
          `${API_URL}/products?search=${encodeURIComponent(debouncedQuery)}&limit=5`
        );
        const prodData = await prodRes.json();
        if (prodData.success) setProducts(prodData.data);

        // Fetch Categories
        const catRes = await fetch(
          `${API_URL}/categories?search=${encodeURIComponent(debouncedQuery)}`
        );
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setProducts([]);
    setCategories([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-md mx-auto" ref={containerRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={t('common', 'searchPlaceholder', { defaultValue: 'Search for products...' })}
          className="pl-4 pr-12 h-11 rounded-md border-primary/20 focus-visible:border-primary shadow-sm transition-all text-base bg-white dark:bg-muted/20"
        />

        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            className="h-full w-12 rounded-l-none rounded-r-md bg-secondary hover:bg-secondary/80 text-secondary-foreground border-l border-primary/10"
            onClick={() => {
              router.push(`/products?search=${encodeURIComponent(query)}`);
              setIsOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-search"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-md border rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-border/50">
          <Tabs
            defaultValue="products"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="p-2 border-b bg-muted/30">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="products">
                  {t('common', 'products', { defaultValue: 'Products' })} ({products.length})
                </TabsTrigger>
                <TabsTrigger value="categories">
                  {t('common', 'categories', { defaultValue: 'Categories' })} ({categories.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground">
                  {t('common', 'loading', { defaultValue: 'Loading...' })}
                </div>
              ) : (
                <>
                  <TabsContent value="products" className="m-0">
                    {products.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {t('common', 'noProductsFound', { defaultValue: 'No products found.' })}
                      </div>
                    ) : (
                      <ul className="py-2 divide-y">
                        {products.map((product) => (
                          <li key={product.id}>
                            <Link
                              href={`/${product.slug}`}
                              className="flex items-start gap-3 px-4 py-2 hover:bg-muted/50 transition-colors group"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                                {product.images?.[0] && (
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                  {getLocalized(product, locale, 'name')}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-bold text-red-600">
                                    {formatPrice(product.sellingPrice)}
                                  </span>
                                  {product.basePrice > product.sellingPrice && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatPrice(product.basePrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  <TabsContent value="categories" className="m-0">
                    {categories.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {t('common', 'noCategoriesFound', { defaultValue: 'No categories found.' })}
                      </div>
                    ) : (
                      <ul className="py-2 divide-y">
                        {categories.map((category) => (
                          <li key={category.id}>
                            <Link
                              href={`/categories/${category.slug}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border bg-muted flex items-center justify-center">
                                {category.image ? (
                                  <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-bold text-muted-foreground">
                                    {category.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium">
                                {getLocalized(category, locale, 'name')}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </>
              )}
            </ScrollArea>

            <div className="p-2 border-t bg-muted/30">
              <Button
                variant="secondary"
                className="w-full text-xs h-8"
                onClick={() => {
                  router.push(`/products?search=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                }}
              >
                {t('common', 'seeAllResults', { defaultValue: 'See all results' })}
              </Button>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
