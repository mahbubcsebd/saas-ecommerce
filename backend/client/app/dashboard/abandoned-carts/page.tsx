import { Cart, fetchApi } from '@/lib/api';
import { AbandonCartClient } from './client';

export const metadata = {
  title: 'Abandoned Carts | Dashboard',
  description: 'Manage and recover abandoned shopping carts.',
};

export default async function AbandonedCartsPage() {
  let carts: Cart[] = [];

  try {
    const res: any = await fetchApi('/abandoned-carts?limit=100');
    console.log('Abandoned Carts Fetch Success:', res);
    carts = res.data || [];
  } catch (error) {
    console.error("Failed to fetch abandoned carts:", error);
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <AbandonCartClient initialData={carts} />
    </div>
  );
}
