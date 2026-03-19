import FlashSale from '@/components/home/FlashSale';
import { getFlashSale } from '@/lib/fetchers';

export default async function FlashSaleSection() {
  const result = await getFlashSale();
  const flashSale = result?.data || null;
  return <FlashSale flashSale={flashSale} />;
}
