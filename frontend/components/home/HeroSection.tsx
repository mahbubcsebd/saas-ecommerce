import { getHeroSlides } from "@/lib/fetchers";
import nextDynamic from "next/dynamic";

const HeroSlider = nextDynamic(() => import("@/components/HeroSlider"), {
  ssr: true, // Keep initial HTML for better SEO/LCP, but JS will load later
});

export default async function HeroSection() {
  const slides = await getHeroSlides();
  return <HeroSlider slides={slides} />;
}
