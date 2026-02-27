import CategorySections from "@/components/home/CategorySections";
import FeaturedCategoriesSection from "@/components/home/FeaturedCategoriesSection";
import FlashSaleSection from "@/components/home/FlashSaleSection";
import HeroSection from "@/components/home/HeroSection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import Newsletter from "@/components/home/Newsletter";
import SectionSkeleton from "@/components/home/SectionSkeleton";
import TopSellingSection from "@/components/home/TopSellingSection";
import TrustSignals from "@/components/home/TrustSignals";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* 1. Hero Slider (Streaming) */}
      <Suspense fallback={<SectionSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* 2. Features Section (Static - Trust Signals) */}
      <TrustSignals />

      {/* 3. Flash Sale (Streaming) */}
      <Suspense fallback={<SectionSkeleton />}>
        <FlashSaleSection />
      </Suspense>

      {/* 4. Featured Categories (Streaming) */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedCategoriesSection />
      </Suspense>

      {/* 5. Top Selling (Streaming) */}
      <Suspense fallback={<SectionSkeleton />}>
         <TopSellingSection />
      </Suspense>

      {/* 6. New Arrivals (Streaming) */}
      <Suspense fallback={<SectionSkeleton />}>
        <NewArrivalsSection />
      </Suspense>

      {/* 7. Dynamic Category Sections (Streaming) */}
      <Suspense fallback={<SectionSkeleton />}>
        <CategorySections />
      </Suspense>

      {/* 8. Newsletter Section (Static) */}
      <Newsletter />
    </div>
  );
}