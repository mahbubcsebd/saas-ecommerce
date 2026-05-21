import FeaturedBrands from '@/components/home/FeaturedBrands';
import { getFeaturedBrands } from '@/lib/fetchers';

export default async function FeaturedBrandsSection() {
  const brands = await getFeaturedBrands();
  return <FeaturedBrands brands={brands} />;
}
