import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
}

export default async function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  let relatedProducts: Product[] = [];

  try {
    const res = await fetch(`${apiUrl}/products/related/${currentProductId}?limit=4`, {
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        relatedProducts = data.data;
      }
    }
  } catch (error) {
    console.error("Failed to fetch related products:", error);
  }

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
