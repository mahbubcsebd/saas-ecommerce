'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from '@/context/TranslationContext';
import { useCurrency } from '@/hooks/useCurrency';
import { getLocalized } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  translations?: any[];
}

interface SidebarFilterProps {
  categories: Category[];
  baseUrl?: string;
  categoryMode?: 'filter' | 'link';
}

export default function SidebarFilter({
  categories,
  baseUrl = '/products',
  categoryMode = 'filter',
}: SidebarFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslations();
  const { formatPrice } = useCurrency();

  // State
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<string>('');

  useEffect(() => {
    // Parse URL params on load
    const categoriesFromUrl = searchParams.getAll('category');
    if (categoriesFromUrl.length > 0) {
      setSelectedCategories(categoriesFromUrl);
    } else {
      setSelectedCategories([]);
    }

    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    if (minPriceParam && maxPriceParam) {
      setPriceRange([parseInt(minPriceParam), parseInt(maxPriceParam)]);
    }

    const ratingParam = searchParams.get('minRating');
    if (ratingParam) {
      setMinRating(ratingParam);
    }
  }, [searchParams]);

  const handleFilter = () => {
    const params = new URLSearchParams();

    // Categories (only if in filter mode)
    if (categoryMode === 'filter') {
      selectedCategories.forEach((c) => params.append('category', c));
    }

    // Price
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 1000) params.set('maxPrice', priceRange[1].toString());

    // Rating
    if (minRating) params.set('minRating', minRating);

    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('filters', 'title', 'Filters')}</h3>
        <Button variant="ghost" size="sm" onClick={() => router.push(baseUrl)}>
          {t('filters', 'reset', 'Reset')}
        </Button>
      </div>

      <Accordion type="single" collapsible defaultValue="category" className="w-full">
        {/* Categories */}
        <AccordionItem value="category">
          <AccordionTrigger>{t('filters', 'categories', 'Categories')}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  {categoryMode === 'link' ? (
                    <Link
                      href={`/${cat.slug}`}
                      className="text-sm hover:underline hover:text-primary w-full py-1 text-muted-foreground transition-colors"
                    >
                      {getLocalized(cat, locale, 'name')}
                    </Link>
                  ) : (
                    <>
                      <Checkbox
                        id={cat.id}
                        checked={selectedCategories.includes(cat.slug)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, cat.slug]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((c) => c !== cat.slug));
                          }
                        }}
                      />
                      <Label htmlFor={cat.id}>{getLocalized(cat, locale, 'name')}</Label>
                    </>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price">
          <AccordionTrigger>{t('filters', 'priceRange', 'Price Range')}</AccordionTrigger>
          <AccordionContent>
            <div className="px-2 pt-4 pb-2">
              <Slider
                defaultValue={[0, 1000]}
                max={1000}
                step={10}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="border px-2 py-1 rounded w-20 text-center">
                  {formatPrice(priceRange[0])}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className="border px-2 py-1 rounded w-20 text-center">
                  {formatPrice(priceRange[1])}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating */}
        <AccordionItem value="rating">
          <AccordionTrigger>{t('filters', 'rating', 'Rating')}</AccordionTrigger>
          <AccordionContent>
            <RadioGroup value={minRating} onValueChange={setMinRating}>
              {[4, 3, 2, 1].map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.toString()} id={`r-${r}`} />
                  <Label htmlFor={`r-${r}`} className="flex items-center">
                    {Array.from({ length: r }).map((_, i) => (
                      <span key={i} className="text-yellow-500">
                        ★
                      </span>
                    ))}
                    <span className="ml-1 text-muted-foreground">
                      {t('filters', 'andUp', '& Up')}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full" onClick={handleFilter}>
        {t('filters', 'applyFilters', 'Apply Filters')}
      </Button>
    </div>
  );
}
