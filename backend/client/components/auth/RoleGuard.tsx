'use client';

import { hasRole, Role } from '@/lib/permissions';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard'
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    const userRole = session.user.role as Role;

    // Check if user has any of the allowed roles
    const isAllowed = allowedRoles.some(role => hasRole(session.user, role));

    if (!isAllowed) {
      router.push(fallbackPath);
    }
  }, [session, status, allowedRoles, fallbackPath, router]);

  if (status === 'loading') {
    return <div>Loading...</div>; // Or a proper spinner
  }

  if (!session?.user) {
    return null;
  }

  const isAllowed = allowedRoles.some(role => hasRole(session.user, role));

  if (!isAllowed) {
    return null; // or return fallback UI? usually redirect handles it.
  }

  return <>{children}</>;
};
