
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Zap } from "lucide-react";
import Image from 'next/image';
import { PageBlock } from './LandingPageBuilder';

interface RendererProps {
  blocks: PageBlock[];
  themeColor?: string;
  fontFamily?: string;
  onCtaClick?: (blockId: string) => void;
}

const HeroBlock = ({ data, themeColor, onCtaClick }: { data: any, themeColor: string, onCtaClick: any }) => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        {data.headline}
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
        {data.subheadline}
      </p>
      <Button
        size="lg"
        style={{ backgroundColor: themeColor }}
        onClick={onCtaClick}
        className="px-8 py-6 rounded-md font-semibold text-white"
      >
        {data.ctaText}
      </Button>
    </div>
  </section>
);

const FeaturesBlock = ({ data, themeColor }: { data: any, themeColor: string }) => (
  <section className="py-24 bg-white">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Why people love us</h2>
        <div className="h-1.5 w-24 mx-auto rounded-full" style={{ backgroundColor: themeColor }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(data.items || [
          { title: "Fast Delivery", description: "Get your items in 24 hours.", icon: "zap" },
          { title: "Premium Quality", description: "Only handpicked items for you.", icon: "star" },
          { title: "24/7 Support", description: "Our team is here to help anytime.", icon: "check" }
        ]).map((item: any, i: number) => (
          <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-shadow group">
             <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform" style={{ backgroundColor: themeColor + '20', color: themeColor }}>
                <Zap className="h-7 w-7" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
             <p className="text-slate-500 font-medium leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CtaBlock = ({ data, themeColor, onCtaClick }: { data: any, themeColor: string, onCtaClick: any }) => (
  <section className="py-16">
     <div className="container mx-auto px-6">
        <div className="bg-slate-900 rounded-[40px] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-3xl">
           <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">{data.text}</h2>
              <Button
                size="lg"
                style={{ backgroundColor: themeColor }}
                onClick={onCtaClick}
                className="h-16 px-12 rounded-2xl text-xl font-black shadow-2xl hover:scale-105 transition-transform"
              >
                {data.buttonText}
              </Button>
              <div className="flex items-center justify-center gap-6 pt-4 text-xs font-black uppercase tracking-widest text-slate-400">
                 <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Money Back Guarantee</div>
                 <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange-500" /> Offer Ends Soon</div>
              </div>
           </div>

           {/* Glow Effect */}
           <div className="absolute top-0 right-0 w-full h-full opacity-20">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px]" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500 rounded-full blur-[100px]" />
           </div>
        </div>
     </div>
  </section>
);

const Badge = ({ children, className, style }: any) => (
  <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold", className)} style={style}>
    {children}
  </span>
);

export default function LandingPageRenderer({ blocks, themeColor = "#3b82f6", fontFamily = "Inter", onCtaClick }: RendererProps) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily }}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'HERO':
            return <HeroBlock key={block.id} data={block.data} themeColor={themeColor} onCtaClick={() => onCtaClick?.(block.id)} />;
          case 'FEATURES':
            return <FeaturesBlock key={block.id} data={block.data} themeColor={themeColor} />;
          case 'CTA':
            return <CtaBlock key={block.id} data={block.data} themeColor={themeColor} onCtaClick={() => onCtaClick?.(block.id)} />;
          case 'IMAGE':
            return (
              <section key={block.id} className="py-12 container mx-auto px-6">
                 <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl">
                    <Image src={block.data?.url || '/placeholder.jpg'} alt={block.data?.alt || 'Image'} fill className="object-cover" />
                 </div>
              </section>
            );
          case 'HTML':
             return (
               <section key={block.id} className="py-12 container mx-auto px-6">
                  <div dangerouslySetInnerHTML={{ __html: block.data?.content || '' }} />
               </section>
             );
          default:
            return null;
        }
      })}
    </div>
  );
}
