import CategoryProductList from '@/components/category/CategoryProductList';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import {
  generateCategoryMetadata,
  generateProductMetadata,
  generateProductSchema,
} from '@/lib/seo-utils';
import { Product } from '@/types/product';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Data Fetching Utils
async function getProduct(slug: string): Promise<Product | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  try {
    const res = await fetch(`${apiUrl}/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getCategory(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  try {
    const res = await fetch(`${apiUrl}/categories/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function getProductsByCategory(categorySlug: string, searchParams: any) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  const query = new URLSearchParams();
  query.append('category', categorySlug); // Filter by category slug

  // Append other search params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === 'category') return; // Skip category param if present in URL query (we use slug)
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v as string));
    } else if (value) {
      query.append(key, value as string);
    }
  });

  try {
    const res = await fetch(`${apiUrl}/products?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function getAllCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  try {
    const res = await fetch(`${apiUrl}/categories`, { cache: 'force-cache' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (e) {
    return [];
  }
}

// Metadata Generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lastSlug = slug[slug.length - 1];

  // 1. Try Product
  const product = await getProduct(lastSlug);
  if (product) {
    return generateProductMetadata(product);
  }

  // 2. Try Category
  const category = await getCategory(lastSlug);
  if (category) {
    return generateCategoryMetadata(category);
  }

  return {
    title: 'Not Found - Mahbub Shop',
  };
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DynamicPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  // Check for 'all' suffix or exact '/all' route
  const isAllRoute = slug[slug.length - 1] === 'all';
  const isGlobalAll = slug.length === 1 && slug[0] === 'all';

  // 1. GLOBAL '/all' Route -> Show ALL Products
  if (isGlobalAll) {
    const [products, allCategories] = await Promise.all([
      getProductsByCategory('', resolvedSearchParams), // Empty category slug fetches all
      getAllCategories(),
    ]);

    const allProductsCategory = {
      id: 'all-products',
      name: 'All Products',
      slug: 'all',
      children: allCategories, // Show root categories in sidebar
      parentId: null,
    };

    return (
      <CategoryProductList
        products={products}
        allCategories={allCategories}
        category={allProductsCategory}
      />
    );
  }

  const lastSlug = isAllRoute ? slug[slug.length - 2] : slug[slug.length - 1];

  // 2. Try Product (only if NOT an 'all' route)
  // If it is an 'all' route, we skip product check because 'all' is reserved for category view.
  let product = null;
  if (!isAllRoute) {
    product = await getProduct(lastSlug);
  }

  if (product) {
    // Generate Schema
    const schema = generateProductSchema(product);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <div className="container mx-auto px-4 py-8">
          <ProductDetailsClient product={product} />
        </div>
      </>
    );
  }

  // 2. Try Category
  const category = await getCategory(lastSlug);

  if (category) {
    const [products, allCategories] = await Promise.all([
      getProductsByCategory(category.slug, resolvedSearchParams),
      getAllCategories(),
    ]);

    return (
      <CategoryProductList products={products} allCategories={allCategories} category={category} />
    );
  }

  // 3. Not Found
  notFound();
}
