import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AddressList from '@/components/profile/AddressList';
import { api } from '@/lib/api-client';
import { createT, getLocale, getTranslations } from '@/lib/i18n';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AddressPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile/address');
  }

  const locale = await getLocale();
  const translations = await getTranslations(locale);
  const t = createT(translations);

  let addresses = [];
  try {
    const data = await api.get<any[]>('/addresses', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      revalidate: 0, // Fetch always on the server for user data
    });
    addresses = data || [];
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">
          {t('common', 'manage', 'Manage')}{' '}
          <span className="text-primary">{t('common', 'addresses', 'Addresses')}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {t(
            'profile',
            'addressSubtitle',
            'Add or edit your shipping addresses for a faster checkout experience.'
          )}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
        <AddressList initialAddresses={addresses} />
      </div>
    </div>
  );
}
