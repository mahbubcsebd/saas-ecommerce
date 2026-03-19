import ProductView from '@/components/ProductView';
import SidebarFilter from '@/components/SidebarFilter';
import { getCategories, getProducts } from '@/lib/fetchers';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams; // Await params in Next.js 15+
  const [productsRes, categories] = await Promise.all([
    getProducts(resolvedParams),
    getCategories(),
  ]);

  const products = productsRes.data || [];
  const total = productsRes.total || products.length;

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense
            fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />}
          >
            <SidebarFilter categories={categories} />
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
