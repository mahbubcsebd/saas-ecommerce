import ProductView from "@/components/ProductView";
import SidebarFilter from "@/components/SidebarFilter";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function getProducts(searchParams: any) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v as string));
    } else if (value) {
      query.append(key, value as string);
    }
  });

  const res = await fetch(`${API_URL}/products?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
}

async function getCategories() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  const res = await fetch(`${API_URL}/categories`, { cache: 'force-cache' }); // Cache categories
  if (!res.ok) return { data: [] };
  return res.json();
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams; // Await params in Next.js 15+
  const [productsRes, categoriesRes] = await Promise.all([
    getProducts(resolvedParams),
    getCategories(),
  ]);

  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];

  return (
    <div className="container py-8">
      {/* Breadcrumb / Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold">All Products</h1>
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
                Showing {products.length} results
            </span>
             {/* Sort (Client Component wrapper needed for interactivity or simple form submit?)
                 For simplicity, we can use a Client Component for the storage of sort state or just links.
                 But SidebarFilter handles URL. Let's make a simple Sort component or just use links/form.
                 Actually, SidebarFilter is complex. Let's put Sort in a client component or simpler:
                 Just use a Client Component for the top bar?
                 Let's keep it simple: Render Select here, but logic needs client.
                 I'll add a simple client component for Sort within this file or inline script?
                 No, let's create a minimal client component `ProductSort.tsx` or just put it in `SidebarFilter`?
                 No, Sidebar is for filters.

                 Let's create a `ProductHeader.tsx` client component for Sort/Grid toggle.
             */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>Loading filters...</div>}>
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
