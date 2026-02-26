import HeroSlider from "@/components/HeroSlider";
import CategoryProductSlider from "@/components/home/CategoryProductSlider";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import NewArrivals from "@/components/home/NewArrivals";
import { getFeaturedCategories, getHeroSlides, getHomeSections, getNewArrivals } from "@/lib/fetchers";
import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [heroSlides, featuredCategories, newArrivals, homeSections] = await Promise.all([
    getHeroSlides(),
    getFeaturedCategories(),
    getNewArrivals(),
    getHomeSections(),
  ]);

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* 1. Hero Slider (SSR) */}
      <HeroSlider slides={heroSlides} />

      {/* 2. Features Section (Static - Trust Signals) */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-8 border rounded-lg bg-card shadow-sm">
            <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
                <Truck className="w-8 h-8 text-primary" />
                <div>
                    <h3 className="font-semibold">Free Shipping</h3>
                    <p className="text-xs text-muted-foreground">On orders over $100</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                    <h3 className="font-semibold">Secure Payment</h3>
                    <p className="text-xs text-muted-foreground">100% secure payment</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
                <CreditCard className="w-8 h-8 text-primary" />
                <div>
                    <h3 className="font-semibold">Buyer Protection</h3>
                    <p className="text-xs text-muted-foreground">Money back guarantee</p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4">
                <Headset className="w-8 h-8 text-primary" />
                <div>
                    <h3 className="font-semibold">24/7 Support</h3>
                    <p className="text-xs text-muted-foreground">Dedicated support</p>
                </div>
            </div>
        </div>
      </section>

      {/* 3. Featured Categories (SSR) */}
      <FeaturedCategories categories={featuredCategories} />

      {/* 4. New Arrivals (SSR) */}
      <NewArrivals products={newArrivals} />

      {/* 5. Dynamic Category Sections (SSR) */}
      {homeSections.map((section: any) => (
        <CategoryProductSlider
          key={section.categorySlug}
          categorySlug={section.categorySlug}
          title={section.categoryName}
          categoryName={section.categoryName}
          products={section.products}
        />
      ))}

      {/* 6. Newsletter Section (Static) */}
      <section className="container py-16">
        <div className="relative rounded-2xl overflow-hidden bg-primary px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
            <div className="relative mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                    Get the latest updates
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
                    Subscribe to our newsletter and stay updated on the latest products, special offers, and discounts.
                </p>
                <div className="mt-10 flex max-w-md mx-auto gap-x-4">
                    <label htmlFor="email-address" className="sr-only">Email address</label>
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="min-w-0 flex-auto rounded-md border-0 bg-white/10 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-white/75 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 placeholder:pl-2"
                        placeholder="Enter your email"
                    />
                    <button
                        type="submit"
                        className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}