import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';
import { getRelatedProducts } from '@/lib/fetchers';

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
}

export default async function RelatedProducts({
  categoryId,
  currentProductId,
}: RelatedProductsProps) {
  const relatedProducts = await getRelatedProducts(currentProductId, 4);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
