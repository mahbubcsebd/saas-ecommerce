import { getBrandBySlug, getProducts, getCategories } from '@/lib/fetchers';
import BrandProductList from '@/components/brand/BrandProductList';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return {
      title: 'Brand Not Found - Mahbub Shop',
    };
  }

  return {
    title: brand.metaTitle || `${brand.name} - Official Collection | Mahbub Shop`,
    description: brand.metaDescription || `Shop the official and authentic collection of ${brand.name} products at Mahbub Shop. Get the best pricing, deals, and warranty in Bangladesh.`,
    keywords: brand.metaKeywords || `${brand.name}, ${brand.name} bd, brand products`,
    openGraph: {
      title: brand.metaTitle || `${brand.name} Collection`,
      description: brand.metaDescription || `Official authentic products of ${brand.name} at Mahbub Shop.`,
      images: brand.image ? [{ url: brand.image }] : [],
    },
  };
}

export default async function BrandSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const brand = await getBrandBySlug(slug);
  if (!brand) {
    notFound();
  }

  // Fetch products that match this brand. We pass searchParams so pagination and sorting work beautifully!
  const productsResponse = await getProducts({
    brandSlug: slug,
    ...resolvedSearchParams,
  });

  const allCategories = await getCategories();

  return (
    <BrandProductList
      brand={brand}
      products={productsResponse?.data || []}
      allCategories={allCategories}
    />
  );
}
