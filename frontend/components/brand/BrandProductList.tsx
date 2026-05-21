'use client';

import ProductView from '@/components/ProductView';
import SidebarFilter from '@/components/SidebarFilter';
import { useTranslations } from '@/context/TranslationContext';
import { cn, getLocalized } from '@/lib/utils';
import { Suspense } from 'react';
import { Tag, ShieldCheck, Award } from 'lucide-react';

interface BrandProductListProps {
  products: any[];
  allCategories: any[];
  brand: any;
}

export default function BrandProductList({
  products,
  allCategories,
  brand,
}: BrandProductListProps) {
  const { locale, t } = useTranslations();
  const localizedBrandName = getLocalized(brand, locale, 'name') || brand.name;

  return (
    <div className="container py-8">
      {/* Premium Brand Header Banner */}
      <div className="relative h-[250px] md:h-[350px] rounded-3xl overflow-hidden mb-12 group border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Abstract background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950" />
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Brand visual showcase with overlay */}
        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors duration-500" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Brand Info with Glassmorphism */}
          <div className="max-w-2xl backdrop-blur-md bg-white/10 dark:bg-slate-900/40 p-6 md:p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-2xl animate-in slide-in-from-bottom-8 duration-700 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            {/* Logo */}
            <div className="w-24 h-24 shrink-0 rounded-2xl bg-white flex items-center justify-center p-3 border border-white/20 shadow-md">
              {brand.image ? (
                <img
                  src={brand.image}
                  alt={localizedBrandName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-3xl font-black text-indigo-500 select-none italic uppercase">
                  {localizedBrandName.slice(0, 2)}
                </span>
              )}
            </div>

            {/* Description / Metadata */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-500/30">
                <Award className="w-3.5 h-3.5" />
                {t('brands', 'certifiedBrand', 'Authorized Brand')}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-md uppercase tracking-tight italic">
                {localizedBrandName}
              </h1>
              <p className="text-white/90 text-xs md:text-sm font-medium line-clamp-2 leading-relaxed drop-shadow-sm max-w-xl">
                {getLocalized(brand, locale, 'description') ||
                  t('brands', 'exploreDesc', {
                    name: localizedBrandName,
                    defaultValue: `Browse the exclusive premium range of authentic products from ${localizedBrandName} at Mahbub Shop.`,
                  })}
              </p>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="flex md:flex-col items-center md:items-end gap-3 self-center md:self-end">
            <span className="bg-white/90 dark:bg-slate-950/80 text-slate-900 dark:text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg border border-slate-200/20">
              {products.length} {products.length === 1 ? t('brands', 'product', 'Product') : t('brands', 'products', 'Products')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>{t('filters', 'loadingFilters', 'Loading filters...')}</div>}>
            <div className="space-y-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white dark:bg-slate-950/30 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider">
                    {t('brands', 'filterByCategory', 'Filter Categories')}
                  </h3>
                </div>
                {/* Custom Category list filter links */}
                <SidebarFilter
                  categories={allCategories}
                  baseUrl="/products"
                  categoryMode="link"
                />
              </div>
            </div>
          </Suspense>
        </aside>

        {/* Product Grid & Sort */}
        <div className="lg:col-span-3">
          <ProductView products={products} />
        </div>
      </div>

      {/* SEO Section (Price List & Long Description) */}
      <div className="mt-20 pt-16 border-t border-slate-200 dark:border-slate-800/80 transition-all duration-500">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* 1. Price List Table */}
          {products && products.length > 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                  {t('brands', 'livePriceUpdate', 'Live Price Update')}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                  {t('brands', 'latestPriceBD', {
                    name: localizedBrandName,
                    year: String(new Date().getFullYear()),
                    defaultValue: `Latest ${localizedBrandName} Price in BD ${new Date().getFullYear()}`,
                  })}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-2xl">
                  {t('brands', 'discoverCompetitive', {
                    name: localizedBrandName,
                    defaultValue: `Discover the most competitive prices for ${localizedBrandName} products in Bangladesh.`,
                  })}{' '}
                  {t('brands', 'updatedDaily', 'Updated daily at Mahbub Shop.')}
                </p>
              </div>

              <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-white italic">
                        {t('brands', 'modelName', 'Model / Name')}
                      </th>
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-white text-right italic">
                        {t('brands', 'bdtPrice', 'BDT Price')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 15).map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cn(
                          'group transition-all duration-300',
                          idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/10',
                          'border-b border-slate-100 dark:border-slate-850 last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
                        )}
                      >
                        <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-350 group-hover:text-indigo-500 transition-colors cursor-pointer capitalize">
                          {getLocalized(p, locale, 'name')}
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white text-right tabular-nums">
                          <span className="text-indigo-600 dark:text-indigo-400 mr-1">৳</span>
                          {p.sellingPrice > 0 ? p.sellingPrice.toLocaleString() : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. SEO Content / Rich Description */}
          {getLocalized(brand, locale, 'description') && (
            <div className="space-y-10 py-12 px-8 md:px-12 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-200/60 dark:border-slate-850 shadow-inner">
              <div
                className="prose prose-slate dark:prose-invert prose-lg max-w-none
                  prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:italic prose-headings:text-slate-900 dark:prose-headings:text-white
                  prose-p:text-slate-600 dark:prose-p:text-slate-450 prose-p:leading-relaxed prose-p:font-medium
                  prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-black
                  prose-li:text-slate-600 dark:prose-li:text-slate-450 prose-li:font-medium
                  prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline prose-a:font-bold prose-a:transition-all
                  animate-in fade-in slide-in-from-bottom-10 duration-1000"
                dangerouslySetInnerHTML={{ __html: getLocalized(brand, locale, 'description') }}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 border-t border-slate-200 dark:border-slate-800 italic">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-indigo-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    {t('brands', 'seoVerified', 'Authenticity & Specs Verified by Mahbub Shop')}
                  </p>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-550">
                  {t('brands', 'lastSync', {
                    date: new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'bn-BD', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                    defaultValue: `Last Updated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
