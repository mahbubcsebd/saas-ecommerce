import { Product } from '@/types/product';
import { Metadata } from 'next';

export function generateProductSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating:
      product.numReviews > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.numReviews,
          }
        : undefined,
  };
}

export function generateProductMetadata(product: Product): Metadata {
  const title = product.metaTitle || `${product.brand ? product.brand + ' ' : ''}${product.name}`;
  const description =
    product.metaDescription || product.description?.slice(0, 155) || `Buy ${product.name} online`;
  const image = product.ogImage || product.images[0] || '/placeholder.jpg';

  return {
    title,
    description,
    keywords: product.metaKeywords,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
export function generateCategoryMetadata(category: any): Metadata {
  const title = category.metaTitle || `${category.name} - Mahbub Shop`;
  const description =
    category.metaDescription ||
    category.description?.slice(0, 155) ||
    `Explore our ${category.name} collection at Mahbub Shop.`;
  const image = category.image || '/placeholder.jpg';

  return {
    title,
    description,
    keywords: category.metaKeywords,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
