import FeaturedCategories from "@/components/home/FeaturedCategories";
import { getFeaturedCategories } from "@/lib/fetchers";

export default async function FeaturedCategoriesSection() {
  const categories = await getFeaturedCategories();
  return <FeaturedCategories categories={categories} />;
}
