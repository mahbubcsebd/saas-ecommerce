import { Metadata } from 'next';
import { getPublicSettings } from '@/lib/fetchers';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Read our Terms and Conditions',
};

export default async function TermsPage() {
  const settings = await getPublicSettings();
  const termsContent = settings?.legal?.termsAndConditions || null;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <h1 className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 tracking-tight text-center">
        Terms and Conditions
      </h1>

      <div className="bg-card rounded-2xl p-6 md:p-10 border shadow-sm">
        {termsContent ? (
          <div
            className="prose prose-zinc dark:prose-invert max-w-none prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: termsContent }}
          />
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p>Our Terms and Conditions are currently being updated.</p>
            <p className="mt-2">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
