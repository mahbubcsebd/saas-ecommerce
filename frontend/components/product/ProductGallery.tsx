'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { FreeMode, Navigation, Pagination, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Play } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';

interface ProductGalleryProps {
  images: string[];
  videoUrls?: string[];
  title: string;
}

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }
  if (url.includes('youtube.com/embed/')) {
    const parts = url.split('youtube.com/embed/');
    if (parts[1]) {
      const id = parts[1].split('?')[0];
      if (id.length === 11) return id;
    }
  }
  return null;
}

export default function ProductGallery({ images, videoUrls = [], title }: ProductGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Esc key closure for premium feel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVideoModalOpen(false);
        setActiveVideoId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Consolidate images and videos into unified gallery items list
  const galleryItems = [
    ...images.map((img) => ({ type: 'image' as const, url: img, thumbnail: img, id: null })),
    ...videoUrls
      .map((video) => {
        const videoId = getYouTubeId(video);
        if (videoId) {
          return {
            type: 'video' as const,
            url: `https://www.youtube.com/embed/${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            id: videoId,
          };
        }
        return null;
      })
      .filter((v): v is { type: 'video'; url: string; thumbnail: string; id: string } => v !== null),
  ];

  if (galleryItems.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted flex items-center justify-center text-muted-foreground">
        No Image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Thumbs, FreeMode]}
        navigation
        pagination={{ clickable: true }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        className="w-full aspect-square rounded-xl overflow-hidden border"
        spaceBetween={10}
      >
        {galleryItems.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full bg-background aspect-square">
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={`${title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
              ) : (
                <div
                  className="relative w-full h-full cursor-pointer group select-none"
                  onClick={() => {
                    setActiveVideoId(item.id);
                    setVideoModalOpen(true);
                  }}
                >
                  <Image
                    src={item.thumbnail}
                    alt={`${title} - Video Cover`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Premium Overlay Backdrop */}
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors duration-300 flex flex-col items-center justify-center animate-in fade-in" />
                  
                  {/* Pulsing Play Button */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute inline-flex h-24 w-24 rounded-full bg-white/20 animate-ping opacity-75 duration-1000" />
                      <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-600/30 animate-pulse duration-1000" />
                      
                      <div className="relative w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </div>
                    </div>
                    <span className="text-white font-semibold text-sm bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 tracking-wide uppercase text-[11px] transition-transform duration-300 group-hover:translate-y-0.5">
                      Play Video
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnail Swiper */}
      {galleryItems.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs, FreeMode]}
          spaceBetween={12}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          className="w-full"
        >
          {galleryItems.map((item, index) => (
            <SwiperSlide
              key={index}
              className="opacity-60 [&.swiper-slide-thumb-active]:opacity-100 transition-opacity"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-transparent [&.swiper-slide-thumb-active]:border-primary hover:border-primary/50 transition-all cursor-pointer bg-muted group">
                {item.type === 'image' ? (
                  <Image
                    src={item.thumbnail}
                    alt={`${title} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                ) : (
                  <>
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={`${title} video thumbnail`}
                        fill
                        className="object-cover opacity-80"
                        sizes="(max-width: 768px) 25vw, 10vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/20 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Video Lightbox Popup Modal */}
      {videoModalOpen && activeVideoId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => {
            setVideoModalOpen(false);
            setActiveVideoId(null);
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              setVideoModalOpen(false);
              setActiveVideoId(null);
            }}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border border-white/10 shadow-lg"
            aria-label="Close video player"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* IFrame Container */}
          <div
            className="relative w-full max-w-4xl aspect-video mx-4 rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 transition-transform scale-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${title} - Video Player`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
