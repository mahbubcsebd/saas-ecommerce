import { getHomeSections } from "@/lib/fetchers";
import nextDynamic from "next/dynamic";

const CategoryProductSlider = nextDynamic(() => import("@/components/home/CategoryProductSlider"), {
  ssr: true,
});

export default async function CategorySections() {
  const sections = await getHomeSections();
  return (
    <>
      {sections.map((section: any) => (
        <CategoryProductSlider
          key={section.categorySlug}
          categorySlug={section.categorySlug}
          title={section.categoryName}
          categoryName={section.categoryName}
          products={section.products}
        />
      ))}
    </>
  );
}
