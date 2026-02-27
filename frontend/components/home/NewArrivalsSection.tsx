import NewArrivals from "@/components/home/NewArrivals";
import { getNewArrivals } from "@/lib/fetchers";

export default async function NewArrivalsSection() {
  const products = await getNewArrivals();
  return <NewArrivals products={products} />;
}
