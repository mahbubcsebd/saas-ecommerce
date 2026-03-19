'use client';

import { useTranslations } from '@/context/TranslationContext';
import { Product } from '@/types/product';
import { Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '../ProductCard';

interface FlashSaleData {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  products: {
    productId: string;
    discountType: string;
    discountValue: number;
    salePrice: number;
    stockLimit: number;
    product: Product;
  }[];
}

interface FlashSaleProps {
  flashSale: FlashSaleData | null;
}

export default function FlashSale({ flashSale }: FlashSaleProps) {
  const { t } = useTranslations();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!flashSale || !flashSale.endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(flashSale.endDate).getTime() - new Date().getTime();
      let timeLeftObj = null;

      if (difference > 0) {
        timeLeftObj = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeftObj;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  if (!flashSale || !flashSale.products || flashSale.products.length === 0 || !timeLeft)
    return null;

  return (
    <section className="container py-12">
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 lg:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-destructive">
              <Timer className="h-6 w-6" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
                {t('home', 'flashSale', 'Flash Sale')}
              </h2>
            </div>
            {flashSale.name && <h3 className="text-lg font-semibold">{flashSale.name}</h3>}
            {flashSale.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">{flashSale.description}</p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end">
            <span className="text-sm font-semibold text-muted-foreground uppercase mb-2">
              {t('home', 'endsIn', 'Ends In')}
            </span>
            <div className="flex gap-2 text-center">
              <div className="bg-destructive text-destructive-foreground rounded-lg px-3 py-2 min-w-[60px]">
                <strong className="text-xl block">{String(timeLeft.days).padStart(2, '0')}</strong>
                <span className="text-[10px] uppercase font-bold opacity-80">
                  {t('home', 'days', 'Days')}
                </span>
              </div>
              <span className="text-2xl font-bold self-start mt-1">:</span>
              <div className="bg-destructive text-destructive-foreground rounded-lg px-3 py-2 min-w-[60px]">
                <strong className="text-xl block">{String(timeLeft.hours).padStart(2, '0')}</strong>
                <span className="text-[10px] uppercase font-bold opacity-80">
                  {t('home', 'hrs', 'Hrs')}
                </span>
              </div>
              <span className="text-2xl font-bold self-start mt-1">:</span>
              <div className="bg-destructive text-destructive-foreground rounded-lg px-3 py-2 min-w-[60px]">
                <strong className="text-xl block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </strong>
                <span className="text-[10px] uppercase font-bold opacity-80">
                  {t('home', 'mins', 'Mins')}
                </span>
              </div>
              <span className="text-2xl font-bold self-start mt-1">:</span>
              <div className="bg-destructive text-destructive-foreground rounded-lg px-3 py-2 min-w-[60px]">
                <strong className="text-xl block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </strong>
                <span className="text-[10px] uppercase font-bold opacity-80">
                  {t('home', 'secs', 'Secs')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flashSale.products.slice(0, 4).map((item) => (
            <ProductCard key={item.productId} product={item.product} />
          ))}
        </div>
      </div>
    </section>
  );
}
