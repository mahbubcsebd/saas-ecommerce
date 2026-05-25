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
  getCustomPageBySlug,
} from '@/lib/fetchers';
import { Product } from '@/types/product';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from '@/lib/i18n';
import { getLocalized } from '@/lib/utils';

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

  // 3. Try Custom Page
  const page = await getCustomPageBySlug(lastSlug);
  if (page) {
    const locale = await getLocale();
    const title = getLocalized(page, locale, 'title') || 'Page';
    const metaTitle = getLocalized(page, locale, 'metaTitle') || title;
    const metaDescription = getLocalized(page, locale, 'metaDescription') || '';
    const metaKeywords = getLocalized(page, locale, 'metaKeywords') || '';

    return {
      title: `${metaTitle} - Mahbub Shop`,
      description: metaDescription,
      keywords: metaKeywords,
      openGraph: {
        title: `${metaTitle} - Mahbub Shop`,
        description: metaDescription,
        type: 'website',
      },
    };
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

  // 3. Try Custom Page fallback
  const page = await getCustomPageBySlug(lastSlug);
  if (page && page.published) {
    const locale = await getLocale();
    const title = getLocalized(page, locale, 'title');
    const content = getLocalized(page, locale, 'content');

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          .rich-text-container h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; line-height: 1.25; }
          .dark .rich-text-container h1 { color: #f8fafc; }
          .rich-text-container h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.875rem; color: #1e293b; line-height: 1.3; }
          .dark .rich-text-container h2 { color: #f1f5f9; }
          .rich-text-container h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #334155; line-height: 1.35; }
          .dark .rich-text-container h3 { color: #e2e8f0; }
          .rich-text-container p { margin-bottom: 1.25rem; line-height: 1.8; color: #334155; }
          .dark .rich-text-container p { color: #cbd5e1; }
          .rich-text-container ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
          .rich-text-container ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
          .rich-text-container li { margin-bottom: 0.5rem; line-height: 1.7; color: #334155; }
          .dark .rich-text-container li { color: #cbd5e1; }
          .rich-text-container blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; font-style: italic; color: #475569; margin: 1.5rem 0; }
          .dark .rich-text-container blockquote { border-left-color: #3b82f6; color: #94a3b8; }
          .rich-text-container pre { background-color: #f8fafc; padding: 1.25rem; border-radius: 0.5rem; font-family: monospace; overflow-x: auto; margin-bottom: 1.25rem; border: 1px solid #e2e8f0; }
          .dark .rich-text-container pre { background-color: #0f172a; border-color: #1e293b; color: #f8fafc; }
          .rich-text-container img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 2rem auto; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          .rich-text-container a { color: #2563eb; text-decoration: underline; }
          .rich-text-container a:hover { color: #1d4ed8; }
        ` }} />
        <div className="bg-slate-50/30 dark:bg-slate-950/20 min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            <article className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 shadow-sm space-y-10">
              <header className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {title}
                </h1>
                <p className="text-xs text-muted-foreground mt-3">
                  Last updated: {new Date(page.updatedAt || page.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </header>
              <div 
                className="rich-text-container text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </article>
          </div>
        </div>
      </>
    );
  }

  // 4. Not Found
  notFound();
}


