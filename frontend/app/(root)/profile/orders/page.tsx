import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import OrderCard from '@/components/profile/OrderCard';
import { createT, getLocale, getTranslations } from '@/lib/i18n';
import { ChevronRight, Search, ShoppingBag } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getOrders(accessToken: string) {
  try {
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return (await res.json()).data;
  } catch (error) {
    console.error('Orders fetch error:', error);
    return [];
  }
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile/orders');
  }

  const locale = await getLocale();
  const translations = await getTranslations(locale);
  const t = createT(translations);

  const orders = await getOrders(session.accessToken as string);

  const formatPrice = (price: number) => `৳${price?.toLocaleString()}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('profile', 'myOrders', 'My Orders')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t('orders', 'viewAndTrack', 'View and track your previous purchases.')}
          </p>
        </div>

        <div className="relative group w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('orders', 'findOrder', 'Find an order...')}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-6">
        {orders.length > 0 ? (
          orders.map((order: any) => (
            <OrderCard key={order.id} order={order} formatPrice={formatPrice} />
          ))
        ) : (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
              <ShoppingBag className="w-10 h-10" />
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('orders', 'emptyBag', 'Empty Bag')}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                {t('orders', 'noOrdersYet', "You haven't placed any orders yet.")}
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm transition-all hover:bg-primary/90"
            >
              {t('common', 'startShopping', 'Start Shopping')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
