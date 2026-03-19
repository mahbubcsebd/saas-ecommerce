import TopSelling from '@/components/home/TopSelling';
import { getTopSellingProducts } from '@/lib/fetchers';

export default async function TopSellingSection() {
  const result = await getTopSellingProducts();
  const products = result?.data || [];
  return <TopSelling products={products} />;
}
