"use client";

import { useTranslations } from "@/context/TranslationContext";
import { getLocalized } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CategoryTranslation {
    langCode: string;
    name: string;
    description?: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
    order?: number;
    translations?: CategoryTranslation[];
}

export default function MegaMenu() {
    const { locale } = useTranslations();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
                const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

                // Backend now returns nested categories directly (parentId: null filter)
                const res = await fetch(`${apiUrl}/categories`);
                const data = await res.json();

                if (data.success) {
                    // Categories are already nested, no need to build tree
                    setCategories(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="hidden md:block bg-white dark:bg-[#081621] h-[52px] border-b dark:border-none">
                 <div className="container mx-auto flex items-center gap-6 h-full px-4">
                     {[1, 2, 3, 4, 5].map((i) => (
                         <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-white/10 animate-pulse rounded" />
                     ))}
                 </div>
            </div>
        );
    }

    if (categories.length === 0) return null;

    return (
        <div className="hidden md:block bg-white dark:bg-[#081621] text-gray-900 dark:text-white shadow-sm relative font-sans border-b dark:border-none transition-colors duration-300">
            <div className="container mx-auto">
                <style jsx global>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div className="flex items-center gap-1">{/* Removed overflow-x-auto to allow dropdown to show */}
                    {categories.slice(0, 12).map((category) => (
                        <div
                            key={category.id}
                            className="relative"
                            onMouseEnter={() => setHoveredCategoryId(category.id)}
                            onMouseLeave={() => setHoveredCategoryId(null)}
                        >
                            <Link
                                href={`/categories/${category.slug}`}
                                className="flex items-center text-[13px] font-bold px-4 py-3.5 whitespace-nowrap hover:text-[#ef4a23] transition-colors uppercase tracking-wide"
                            >
                                {getLocalized(category, locale, 'name')}
                            </Link>

                            {/* Mega Menu Dropdown */}
                            {category.children && category.children.length > 0 && (
                                <div
                                    className={`absolute top-full left-0 w-[900px] bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 border-t-2 border-[#ef4a23] shadow-2xl rounded-b-md p-6 transition-all duration-200 grid grid-cols-4 gap-y-8 gap-x-6 ${
                                        hoveredCategoryId === category.id
                                            ? 'opacity-100 visible pointer-events-auto'
                                            : 'opacity-0 invisible pointer-events-none'
                                    }`}
                                    style={{ zIndex: 100 }}
                                >
                                    {category.children.map((child: any) => (
                                        <div key={child.id} className="space-y-3 break-inside-avoid">
                                            <Link href={`/categories/${child.slug}`} className="font-bold text-sm text-gray-900 dark:text-white hover:text-[#ef4a23] block border-b dark:border-zinc-800 pb-1.5 mb-2">
                                                {getLocalized(child, locale, 'name')}
                                            </Link>
                                            {child.children && child.children.length > 0 && (
                                                <ul className="space-y-1.5">
                                                    {child.children.map((sub: any) => (
                                                        <li key={sub.id}>
                                                            <Link
                                                                href={`/categories/${sub.slug}`}
                                                                className="text-[13px] text-gray-600 dark:text-gray-400 hover:text-[#ef4a23] hover:underline transition-colors block"
                                                            >
                                                                {getLocalized(sub, locale, 'name')}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}

                                     {category.children.length > 0 && (
                                         <div className="col-span-4 mt-2 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                                            <Link href={`/categories/${category.slug}`} className="text-xs font-bold text-[#ef4a23] hover:underline uppercase flex items-center gap-1">
                                                View All {getLocalized(category, locale, 'name')}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                            </Link>
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>
                    ))}
                    {categories.length > 12 && (
                        <Link href="/categories" className="flex items-center text-[13px] font-bold px-4 py-3.5 hover:text-[#ef4a23] whitespace-nowrap uppercase tracking-wide">
                            All Categories
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
