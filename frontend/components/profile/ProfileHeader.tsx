'use client';

import { useTranslations } from '@/context/TranslationContext';
import { useSession } from 'next-auth/react';

interface ProfileHeaderProps {
  user: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function ProfileHeader({ user: initialUser }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const { t } = useTranslations();

  // Use session user if available for real-time updates, otherwise fallback to prop
  const user = session?.user ? ({ ...initialUser, ...session.user } as any) : initialUser;

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName}`
    : user.name || t('common', 'customer', { defaultValue: 'Customer' });

  const firstChar = displayName?.charAt(0) || 'U';

  return (
    <div className="flex items-center gap-6 mb-8 relative">
      {/* Avatar Container */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative ring-4 ring-slate-50 dark:ring-slate-950/50 transition-all group-hover:ring-primary/10">
          {user.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="w-full h-full object-cover animate-in fade-in duration-500"
              key={user.image}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 font-bold text-3xl transition-transform group-hover:scale-110">
              {firstChar}
            </div>
          )}
        </div>
      </div>

      {/* Info Container */}
      <div className="space-y-1.5 flex-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {displayName}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-slate-500">{user.email}</p>
          <span className="w-1 h-1 rounded-full bg-slate-300 hidden md:inline-block" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
            {user.role || t('common', 'customer', { defaultValue: 'Customer' })}
          </span>
        </div>
      </div>
    </div>
  );
}
