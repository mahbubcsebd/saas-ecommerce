"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types/product";
import Link from "next/link";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ProductCard from "../ProductCard";

import "swiper/css";
import "swiper/css/navigation";

interface CategoryProductSliderProps {
  categorySlug: string;
  title: string;
  categoryName: string;
  products: Product[];
}

export default function CategoryProductSlider({
  categorySlug,
  categoryName,
  title,
  products
}: CategoryProductSliderProps) {

  console.log('CategoryProductSlider props:', products);
  if (!products || products.length === 0) return null;

  return (
    <section className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">{categoryName}</h2>
        <Link
          href={`/${categorySlug}`}
          className="text-primary hover:underline font-medium"
        >
          View All
        </Link>
      </div>

      {/* Swiper Slider */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          navigation
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 4,
            },
          }}
          className="product-swiper"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

export function CategorySliderSkeleton({ title }: { title: string }) {
  return (
    <section className="container py-12">
      <h2 className="text-2xl font-bold mb-8">{title}</h2>
      <div className="flex gap-6 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[280px] space-y-3">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
