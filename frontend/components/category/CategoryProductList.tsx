'use client';

import ProductView from '@/components/ProductView';
import SidebarFilter from '@/components/SidebarFilter';
import { useTranslations } from '@/context/TranslationContext';
import { cn, getLocalized } from '@/lib/utils';
import { Suspense } from 'react';

interface CategoryProductListProps {
  products: any[];
  allCategories: any[];
  category: any;
}

export default function CategoryProductList({
  products,
  allCategories,
  category,
}: CategoryProductListProps) {
  const { locale } = useTranslations();
  // Logic:
  // 1. If category has children, show them.
  // 2. If category has no children but has a parent, show siblings (parent's children).
  // 3. If root category with no children, show all root categories (fallback).

  let sidebarCategories = [];

  if (category.children && category.children.length > 0) {
    sidebarCategories = category.children;
  } else if (category.parentId) {
    sidebarCategories = allCategories;
  } else {
    sidebarCategories = allCategories;
  }

  // Revised Logic based on User Request: "jodi imidiate child category thake tahole segula show korano thik hobe ki?" -> YES.
  const displayCategories =
    category.children && category.children.length > 0 ? category.children : allCategories;
  const localizedCategoryName = getLocalized(category, locale, 'name');
  const { t } = useTranslations();
  const sidebarTitle =
    category.children && category.children.length > 0
      ? t('home', 'explore', {
          name: localizedCategoryName,
          defaultValue: `Explore ${localizedCategoryName}`,
        })
      : t('filters', 'categories', 'Categories');

  return (
    <div className="container py-8">
      {/* Premium Category Banner */}
      <div className="relative h-[250px] md:h-[350px] rounded-3xl overflow-hidden mb-12 group">
        {category.image ? (
          <img
            src={category.image}
            alt={localizedCategoryName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
        )}

        {/* Overlay with Glassmorphism */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

        <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
          <div className="max-w-2xl backdrop-blur-md bg-white/20 p-8 rounded-2xl border border-white/30 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg mb-4 uppercase tracking-tighter">
              {localizedCategoryName}
            </h1>
            <p className="text-white/90 text-sm md:text-base font-medium line-clamp-2 drop-shadow-md">
              {getLocalized(category, locale, 'description') ||
                t('home', 'exploreDesc', {
                  name: localizedCategoryName,
                  defaultValue: `Explore the finest selection of ${localizedCategoryName} at Mahbub Shop.`,
                })}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <span className="bg-white/90 text-slate-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                {t('home', 'productsCount', {
                  count: String(products.length),
                  defaultValue: `${products.length} Products`,
                })}
              </span>
              {category.parent && (
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                  {t('home', 'partOf', {
                    name: getLocalized(category.parent, locale, 'name'),
                    defaultValue: `Part of ${getLocalized(category.parent, locale, 'name')}`,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>{t('filters', 'loadingFilters', 'Loading filters...')}</div>}>
            <div className="space-y-6">
              {/* Specific Sidebar Logic */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">{sidebarTitle}</h3>
                <SidebarFilter
                  categories={displayCategories}
                  baseUrl={category.children?.length > 0 ? `/${category.slug}` : '/categories'}
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
      <div className="mt-20 pt-16 border-slate-200/60 transition-all duration-500">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* 1. Price List Table */}
          {products && products.length > 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {t('home', 'livePriceUpdate', 'Live Price Update')}
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                  {t('home', 'latestPriceBD', {
                    name: localizedCategoryName,
                    year: String(new Date().getFullYear()),
                    defaultValue: `Latest ${localizedCategoryName} Price in BD ${new Date().getFullYear()}`,
                  })}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-2xl">
                  {t('home', 'discoverCompetitive', {
                    name: localizedCategoryName,
                    defaultValue: `Discover the most competitive prices for ${localizedCategoryName} in Bangladesh.`,
                  })}{' '}
                  {t('home', 'updatedDaily', 'Updated daily at Mahbub Shop.')}
                </p>
              </div>

              <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-white italic">
                        {t('home', 'modelName', 'Model / Name')}
                      </th>
                      <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-white text-right italic">
                        {t('home', 'bdtPrice', 'BDT Price')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 15).map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cn(
                          'group transition-all duration-300',
                          idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 dark:bg-slate-800/20',
                          'border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                        )}
                      >
                        <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors cursor-pointer capitalize">
                          {getLocalized(p, locale, 'name')}
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white text-right tabular-nums">
                          <span className="text-primary mr-1">৳</span>
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
          {getLocalized(category, locale, 'description') && (
            <div className="space-y-10 py-12 px-8 md:px-12 bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/50 shadow-inner">
              <div
                className="prose prose-slate dark:prose-invert prose-lg max-w-none
                  prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:italic prose-headings:text-slate-900 dark:prose-headings:text-white
                  prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:font-medium
                  prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-black
                  prose-li:text-slate-600 dark:prose-li:text-slate-400 prose-li:font-medium
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-bold prose-a:transition-all
                  animate-in fade-in slide-in-from-bottom-10 duration-1000"
                dangerouslySetInnerHTML={{ __html: getLocalized(category, locale, 'description') }}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 border-t border-slate-200 dark:border-slate-800 italic">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[1px] bg-primary" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {t('home', 'seoVerified', 'Content Verified by Mahbub Shop SEO Team')}
                  </p>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t('home', 'lastSync', {
                    date: new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'bn-BD', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                    defaultValue: `Last Sync: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
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
