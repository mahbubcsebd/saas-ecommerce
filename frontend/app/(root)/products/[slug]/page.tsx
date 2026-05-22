import ProductBreadcrumbs from '@/components/product/ProductBreadcrumbs';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import { generateProductMetadata, generateProductSchema } from '@/lib/seo-utils';
import { getProductBySlug } from '@/lib/fetchers';
import { Product } from '@/types/product';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  return generateProductMetadata(product);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const schema = generateProductSchema(product);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ProductBreadcrumbs product={product} />
      <ProductDetailsClient product={product} />

      {/* Related Products */}
      <RelatedProducts
        categoryId={
          typeof product.category === 'object' ? (product.category as any).id : product.categoryId
        }
        currentProductId={product.id}
      />
    </div>
  );
}
