'use client';

import { useTranslations } from '@/context/TranslationContext';
import { cn } from '@/lib/utils';
import { Box, Heart, LayoutDashboard, LogOut, MapPin, RotateCcw, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountSidebar() {
  const pathname = usePathname();
  const { t } = useTranslations();

  const menuItems = [
    {
      name: t('profile', 'dashboard'),
      href: '/profile',
      icon: LayoutDashboard,
    },
    {
      name: t('profile', 'editProfile'),
      href: '/profile/edit',
      icon: User,
    },
    {
      name: t('profile', 'myOrders'),
      href: '/profile/orders',
      icon: Box,
    },
    {
      name: t('profile', 'wishlist'),
      href: '/profile/wishlist',
      icon: Heart,
    },
    {
      name: t('profile', 'addresses'),
      href: '/profile/address',
      icon: MapPin,
    },
    {
      name: t('profile', 'returns'),
      href: '/profile/returns',
      icon: RotateCcw,
    },
  ];

  return (
    <aside className="w-full lg:w-64">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('profile', 'accountMenu', { defaultValue: 'Account Menu' })}
          </p>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden',
                  isActive
                    ? 'bg-primary/5 text-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'
                  )}
                />
                {item.name}
              </Link>
            );
          })}

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('common', 'logout')}
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
