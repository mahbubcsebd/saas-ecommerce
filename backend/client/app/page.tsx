"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  sellingPrice: number;
  images: string[];
  category: {
    name: string;
  };
  translations?: any[];
}

export default function Home() {
  const { t, dir } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products?limit=10`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900" dir={dir}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-950 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Mahbub Shop
          </Link>

          <div className="flex items-center gap-4">
            <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300"
            >
                Login
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section (Placeholder) */}
      <section className="bg-blue-600 text-white py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t({
                translations: [
                    { langCode: 'en', title: 'Welcome to Our Store' },
                    { langCode: 'bn', title: 'আমাদের স্টোরে স্বাগতম' }
                ]
            }, 'title') || "Welcome to Our Store"}
          </h1>
          <p className="text-xl opacity-90">
             {t({
                translations: [
                    { langCode: 'en', subtitle: 'Find the best products at the best prices.' },
                    { langCode: 'bn', subtitle: 'সেরা দামে সেরা পণ্য খুঁজুন।' }
                ]
            }, 'subtitle') || "Find the best products at the best prices."}
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            {t({
                translations: [
                    { langCode: 'en', label: 'Latest Products' },
                    { langCode: 'bn', label: 'সর্বশেষ পণ্য' }
                ]
            }, 'label') || "Latest Products"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group">
                <div className="relative h-48 w-full bg-gray-100 dark:bg-slate-700">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={t(product, 'name')}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                    {t(product.category, 'name')}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2" title={t(product, 'name')}>
                    {t(product, 'name')}
                  </h3>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ${product.sellingPrice}
                    </span>
                    {product.basePrice > product.sellingPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.basePrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}