import { createT, getLocale, getTranslations } from '@/lib/i18n';
import { CreditCard, Headset, ShieldCheck, Truck } from 'lucide-react';

export default async function TrustSignals() {
  const locale = await getLocale();
  const translations = await getTranslations(locale);
  const t = createT(translations);

  return (
    <section className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-8 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
          <Truck className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">{t('home', 'freeShipping', 'Free Shipping')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('home', 'freeShippingDesc', 'On orders over $100')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">{t('home', 'securePayment', 'Secure Payment')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('home', 'securePaymentDesc', '100% secure payment')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
          <CreditCard className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">{t('home', 'buyerProtection', 'Buyer Protection')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('home', 'buyerProtectionDesc', 'Money back guarantee')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4">
          <Headset className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">{t('home', 'support', '24/7 Support')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('home', 'supportDesc', 'Dedicated support')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
