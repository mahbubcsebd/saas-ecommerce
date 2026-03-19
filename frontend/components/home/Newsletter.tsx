'use client';

import { subscribeToNewsletter } from '@/actions/newsletter';
import { useTranslations } from '@/context/TranslationContext';
import { Mail } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Newsletter() {
  const { t } = useTranslations();
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, {
    success: false,
    message: '',
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <section className="container py-12 md:py-16">
      <div className="relative rounded-3xl overflow-hidden bg-primary/5 border hover:bg-primary/10 transition-colors duration-500 px-6 py-12 md:py-16 sm:px-12 lg:px-16 mx-auto">
        <div className="relative mx-auto max-w-2xl text-center flex flex-col items-center">
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            {t('home', 'newsletterTitle', 'Get the latest updates')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t(
              'home',
              'newsletterSubtitle',
              'Subscribe to our newsletter and stay updated on the latest products, special offers, and discounts.'
            )}
          </p>
          <form
            action={formAction}
            className="mt-8 flex w-full max-w-md mx-auto flex-col sm:flex-row gap-3"
          >
            <label htmlFor="email-address" className="sr-only">
              {t('common', 'email')}
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className="flex-1 rounded-xl border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:opacity-50 ring-1 ring-inset ring-border transition-shadow placeholder:text-muted-foreground"
              placeholder={t('home', 'emailPlaceholder', 'Enter your email address')}
            />
            <button
              type="submit"
              disabled={isPending}
              className="flex-none rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-all active:scale-95"
            >
              {isPending ? t('common', 'processing') : t('home', 'subscribe')}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {t('home', 'dataPrivacy', 'We care about your data. Read our')}{' '}
            <a href="/privacy" className="underline hover:text-foreground">
              {t('common', 'privacyPolicy')}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
