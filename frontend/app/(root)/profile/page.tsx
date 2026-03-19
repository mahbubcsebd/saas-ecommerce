import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createT, getLocale, getTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Box, ChevronRight, MapPin, MapPinned, ShoppingBag, User as UserIcon } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getDashboardData(accessToken: string) {
  try {
    const [ordersRes, addressRes] = await Promise.all([
      fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 0 },
      }),
      fetch(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 0 },
      }),
    ]);

    const orders = ordersRes.ok ? (await ordersRes.json()).data : [];
    const addresses = addressRes.ok ? (await addressRes.json()).data : [];

    return { orders, addresses };
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return { orders: [], addresses: [] };
  }
}

export default async function ProfileDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile');
  }

  const locale = await getLocale();
  const translations = await getTranslations(locale);
  const t = createT(translations);

  const user = session.user as any;
  const { orders, addresses } = await getDashboardData(session.accessToken as string);
  const recentOrders = orders.slice(0, 3);
  const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('profile', 'hello', 'Hello')},{' '}
            {user.firstName || user.name || t('common', 'customer', 'Customer')}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('profile', 'welcomeSubtitle', 'Welcome to your account dashboard.')}
          </p>
        </div>
        <Link
          href="/profile/edit"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <UserIcon className="w-4 h-4" /> {t('profile', 'editProfile', 'Edit Profile')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('orders', 'totalOrders', 'Total Orders')}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('common', 'wishlistItems', 'Wishlist Items')}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">--</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('common', 'addresses', 'Addresses')}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{addresses.length}</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('orders', 'recentOrders', 'Recent Orders')}</h2>
            <Link
              href="/profile/orders"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              {t('common', 'viewAll', 'View All')} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/profile/orders/${order.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {t('orders', 'orderNumber', 'Order #')}{' '}
                        {order.orderNumber || order.id.slice(-8)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        ৳{order.total?.toLocaleString()}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                          order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {order.status.toLowerCase()}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  {t('orders', 'noOrdersYet', 'No recent orders yet.')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info & Address */}
        <div className="space-y-6">
          {/* Account Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative ring-4 ring-slate-50 dark:ring-slate-900 shadow-sm">
                {user.image ? (
                  <Image src={user.image} alt={user.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {user.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : user.name || t('common', 'customer', 'Customer')}
                </p>
                <p className="text-sm text-slate-500 font-medium">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {t('profile', 'defaultAddress', 'Default Address')}
              </h3>
              <Link
                href="/profile/address"
                className="text-xs font-bold text-primary hover:underline"
              >
                {t('common', 'manage', 'Manage')}
              </Link>
            </div>
            {defaultAddress ? (
              <div className="flex gap-3">
                <MapPinned className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {defaultAddress.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.state} -{' '}
                    {defaultAddress.zipCode}
                  </p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-400 mt-2">
                    Tel: {defaultAddress.phone}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                {t('profile', 'noAddresses', 'No addresses saved.')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Heart } from 'lucide-react';
