import ProductBreadcrumbs from '@/components/product/ProductBreadcrumbs';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import { generateProductMetadata, generateProductSchema } from '@/lib/seo-utils';
import { Product } from '@/types/product';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

async function getProduct(slug: string): Promise<Product | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  // Ensure we don't have double /api if the env var already includes it
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  console.log(`Fetching Product: ${apiUrl}/products/${slug}`);

  try {
    const res = await fetch(`${apiUrl}/products/${slug}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`Fetch failed: ${res.status} ${res.statusText}`);
      // Try reading body for more info
      const text = await res.text();
      console.error(`Response body: ${text}`);
      return null;
    }

    const data = await res.json();
    if (!data.success) {
      console.error(`API Error: ${data.message}`);
      return null;
    }

    return data.data || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

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
  const product = await getProduct(slug);

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
