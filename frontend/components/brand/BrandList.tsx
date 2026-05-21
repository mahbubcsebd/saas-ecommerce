'use client';

import { useState } from 'react';
import { useTranslations } from '@/context/TranslationContext';
import { cn, getLocalized } from '@/lib/utils';
import { Brand } from '@/types/product';
import Link from 'next/link';
import { Search, ArrowRight, Tag, AlertCircle } from 'lucide-react';

interface BrandListProps {
  brands: Brand[];
}

export default function BrandList({ brands }: BrandListProps) {
  const { t, locale } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');

  // Localized search & filter logic
  const filteredBrands = brands.filter((brand) => {
    const localizedName = getLocalized(brand, locale, 'name') || brand.name;
    const localizedDesc = getLocalized(brand, locale, 'description') || brand.description || '';
    
    const searchLower = searchTerm.toLowerCase();
    return (
      localizedName.toLowerCase().includes(searchLower) ||
      localizedDesc.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-12">
      {/* Premium Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-16 md:py-24 text-center border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20 animate-fade-in">
            <Tag className="w-3.5 h-3.5" />
            {t('brands', 'partnerBrands', 'Partner Brands')}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic drop-shadow-md">
            {t('brands', 'exploreBrands', 'Explore Premium Brands')}
          </h1>
          
          <p className="text-slate-300 text-sm md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            {t('brands', 'brandsSubtitle', 'Discover curated products from the world’s most trusted, authentic, and high-performance brands.')}
          </p>

          {/* Search Input Container */}
          <div className="mt-8 max-w-md mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder={t('brands', 'searchPlaceholder', 'Search brands...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all duration-300 text-sm shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredBrands.map((brand) => {
            const localizedName = getLocalized(brand, locale, 'name') || brand.name;
            const localizedDesc = getLocalized(brand, locale, 'description') || brand.description;
            const productCount = brand._count?.products || 0;

            return (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group flex flex-col justify-between h-[360px] p-6 rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden relative"
              >
                {/* Subtle Hover Gradient Background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-50/20 dark:to-indigo-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="space-y-4">
                  {/* Brand Image wrapper */}
                  <div className="h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-transform duration-500 group-hover:scale-95">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={localizedName}
                        className="max-h-20 max-w-[80%] object-contain transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-center">
                        <span className="text-3xl font-black text-indigo-500/30 select-none uppercase tracking-widest italic">
                          {localizedName.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors uppercase tracking-tight leading-tight line-clamp-1">
                      {localizedName}
                    </h3>
                    
                    {localizedDesc ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
                        {localizedDesc.replace(/<[^>]*>?/gm, '')}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
                        {t('brands', 'noDesc', 'Discover this brand\'s elite product selection.')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer details card */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                    {productCount} {productCount === 1 ? t('brands', 'product', 'Product') : t('brands', 'products', 'Products')}
                  </span>
                  
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {t('brands', 'explore', 'Explore')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
            {t('brands', 'noBrandsFound', 'No brands found')}
          </h3>
          <p className="text-sm text-slate-400 max-w-xs">
            {searchTerm 
              ? t('brands', 'tryDifferentSearch', 'We couldn\'t find any brands matching your search term. Try searching for something else.')
              : t('brands', 'noActiveBrands', 'There are currently no active brands listed.')}
          </p>
        </div>
      )}
    </div>
  );
}
