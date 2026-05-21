import { getBrands } from '@/lib/fetchers';
import BrandList from '@/components/brand/BrandList';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Partner Brands - Mahbub Shop',
  description: 'Shop authentic, premium products from our trusted partner brands at Mahbub Shop. Browse brand collections with live inventory and direct pricing.',
  openGraph: {
    title: 'Our Partner Brands - Mahbub Shop',
    description: 'Shop authentic, premium products from our trusted partner brands at Mahbub Shop.',
    type: 'website',
  },
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="container mx-auto px-4 py-8">
      <BrandList brands={brands} />
    </div>
  );
}
