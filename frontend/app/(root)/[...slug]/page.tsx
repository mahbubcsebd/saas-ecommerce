import CategoryProductList from '@/components/category/CategoryProductList';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import {
  generateCategoryMetadata,
  generateProductMetadata,
  generateProductSchema,
} from '@/lib/seo-utils';
import {
  getProductBySlug,
  getCategoryBySlug,
  getProducts,
  getCategories,
} from '@/lib/fetchers';
import { Product } from '@/types/product';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Metadata Generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lastSlug = slug[slug.length - 1];

  // 1. Try Product
  const product = await getProductBySlug(lastSlug);
  if (product) {
    return generateProductMetadata(product);
  }

  // 2. Try Category
  const category = await getCategoryBySlug(lastSlug);
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
    const [productsRes, allCategories] = await Promise.all([
      getProducts(resolvedSearchParams),
      getCategories(),
    ]);
    const products = productsRes?.data || [];

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
    product = await getProductBySlug(lastSlug);
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
  const category = await getCategoryBySlug(lastSlug);

  if (category) {
    const [productsRes, allCategories] = await Promise.all([
      getProducts({ ...resolvedSearchParams, category: category.slug }),
      getCategories(),
    ]);
    const products = productsRes?.data || [];

    return (
      <CategoryProductList products={products} allCategories={allCategories} category={category} />
    );
  }

  // 3. Not Found
  notFound();
}

