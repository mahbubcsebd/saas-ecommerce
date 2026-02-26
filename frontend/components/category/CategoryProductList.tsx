"use client";

import ProductView from "@/components/ProductView";
import SidebarFilter from "@/components/SidebarFilter";
import { useTranslations } from "@/context/TranslationContext";
import { getLocalized } from "@/lib/utils";
import { Suspense } from "react";

interface CategoryProductListProps {
  products: any[];
  allCategories: any[];
  category: any;
}

export default function CategoryProductList({ products, allCategories, category }: CategoryProductListProps) {
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
  const displayCategories = (category.children && category.children.length > 0) ? category.children : allCategories;
  const localizedCategoryName = getLocalized(category, locale, 'name');
  const sidebarTitle = (category.children && category.children.length > 0) ? `Explore ${localizedCategoryName}` : "Categories";

  return (
    <div className="container py-8">
      {/* Breadcrumb / Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold">{localizedCategoryName}</h1>
            <p className="text-muted-foreground mt-1">
                {products.length} products found
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>Loading filters...</div>}>
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
    </div>
  );
}
