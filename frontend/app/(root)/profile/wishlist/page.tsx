'use client';

import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/context/WishlistContext';
import { ChevronRight, Heart } from 'lucide-react';
import Link from 'next/link';

export default function ProfileWishlistPage() {
  const { wishlist, loading } = useWishlist();

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
          Loading your wishlist...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
            My Wishlist
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Items you've saved to buy later. You have {wishlist.length}{' '}
            {wishlist.length === 1 ? 'item' : 'items'}.
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mx-auto shadow-inner shadow-red-100 dark:shadow-none">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              Wishlist is empty
            </h3>
            <p className="text-slate-500 font-medium">
              Save items you like to find them easily later.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            Browse Products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {wishlist.map((item) => (
            <ProductCard key={item.id} product={item.product as any} />
          ))}
        </div>
      )}
    </div>
  );
}
