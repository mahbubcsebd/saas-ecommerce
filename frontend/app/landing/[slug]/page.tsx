import LandingOrderForm from '@/components/landing/LandingOrderForm';
import { getLandingPageBySlug } from '@/lib/fetchers';
import { Check, Clock, ShieldCheck, Star, Truck } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// Force regular fetch instead of static generation for now, or allow ISR
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.heroSubheadline,
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getLandingPageBySlug(slug);

  if (!page || !page.isActive) {
    notFound();
  }

  const { product } = page;

  return (
    <div
      className="min-h-screen bg-gray-50 font-sans"
      style={{ '--primary-color': page.themeColor } as React.CSSProperties}
    >
      {/* Sticky Bottom CTA for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <a
          href="#order-form"
          className="block w-full bg-primary text-primary-foreground text-center font-bold py-3 rounded-lg shadow-lg animate-pulse"
        >
          ORDER NOW - Tk. {product.sellingPrice}
        </a>
      </div>

      {/* HEADER / HERO SECTION */}
      <div className="bg-white pb-10 md:pb-0 overflow-hidden">
        <div className="container mx-auto px-4 pt-6 pb-12 md:pt-10 md:pb-20">
          {/* Logo Placeholder */}
          {/* <div className="mb-6 flex justify-center md:justify-start">
                <Link href="/" className="text-2xl font-bold text-primary">MyShop</Link>
            </div> */}

          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Hero Content */}
            <div className="text-center md:text-left space-y-6 order-2 md:order-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-600 text-sm font-semibold animate-pulse">
                <Star className="h-4 w-4 fill-current" /> High Demand Product
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                {page.heroHeadline}
              </h1>

              {page.heroSubheadline && (
                <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto md:mx-0">
                  {page.heroSubheadline}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <a
                  href="#order-form"
                  className="px-8 py-4 bg-primary text-primary-foreground font-bold text-xl rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  ORDER NOW
                </a>
                {/* <a href="#features" className="px-8 py-4 bg-white text-gray-900 border border-gray-200 font-semibold text-xl rounded-lg hover:bg-gray-50 transition-colors">
                            Learn More
                        </a> */}
              </div>

              <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-5 w-5 text-green-500" /> Authentic
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="h-5 w-5 text-blue-500" /> Fast Delivery
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-5 w-5 text-orange-500" /> Cash on Delivery
                </div>
              </div>
            </div>

            {/* Hero Media */}
            <div className="order-1 md:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-square md:aspect-[4/3] group">
                {page.isVideoHero && page.heroVideo ? (
                  <iframe
                    src={page.heroVideo.replace('watch?v=', 'embed/')}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : page.heroImage ? (
                  <Image
                    src={page.heroImage}
                    alt={page.heroHeadline}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      {page.features && page.features.length > 0 && (
        <div id="features" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Why You Need This?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {page.features.map((feature: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary">
                    <Check className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DESCRIPTION SECTION */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-primary">
            {page.description ? (
              <div dangerouslySetInnerHTML={{ __html: page.description }} />
            ) : (
              <p className="text-center text-gray-500 italic">No description available.</p>
            )}
          </div>
        </div>
      </div>

      {/* ORDER SECTION */}
      <div id="order-form" className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div className="hidden md:block sticky top-24 space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                Complete Your Order To Get <span className="text-primary">Fast Delivery</span>
              </h2>
              <p className="text-gray-600 text-lg">
                Please fill up the form to confirm your order. We accept Cash on Delivery, so you
                can pay after checking the product.
              </p>

              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Nationwide Delivery</h4>
                    <p className="text-sm text-gray-500">2-3 Days Delivery Time</p>
                  </div>
                </div>
                <div className="border-t pt-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">100% Authentic</h4>
                    <p className="text-sm text-gray-500">Money back guarantee</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form Component */}
            <div>
              <LandingOrderForm product={product} />
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SIMPLE */}
      <div className="bg-gray-900 text-white py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} MyShop. All rights reserved.</p>
      </div>
    </div>
  );
}
