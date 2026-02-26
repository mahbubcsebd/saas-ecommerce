"use client";

import Image from "next/image";
import Link from "next/link";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Interface for HeroSlide
interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  isFeatured: boolean;
  order: number;
}

interface HeroSliderProps {
    slides: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[300px] md:h-[500px]">
      <Swiper
        spaceBetween={0}
        centeredSlides={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
            clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              {/* Image */}
              <Image
                src={slide.image}
                alt={slide.title || "Hero Image"}
                fill
                className="object-cover"
                priority
                unoptimized // Bypass optimization to handle external URLs more reliably in dev
              />

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center text-white p-4">
                {slide.title && (
                    <h2 className="text-3xl md:text-5xl font-bold mb-2 drop-shadow-lg">
                        {slide.title}
                    </h2>
                )}
                {slide.subtitle && (
                    <p className="text-lg md:text-2xl mb-6 drop-shadow-md">
                        {slide.subtitle}
                    </p>
                )}
                {slide.link && (
                    <Link
                        href={slide.link}
                        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-md transition-all shadow-lg"
                    >
                        Shop Now
                    </Link>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
