
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

// Role Hierarchy: Higher index = higher privilege
const ROLES: Role[] = ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];

export const hasRole = (user: { role: string } | undefined | null, requiredRole: Role): boolean => {
  if (!user || !user.role) return false;
  const userRoleIndex = ROLES.indexOf(user.role as Role);
  const requiredRoleIndex = ROLES.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
};

export const canManageUser = (currentUser: { role: string } | undefined | null, targetUserRole: string): boolean => {
  if (!currentUser || !currentUser.role) return false;

  const currentRole = currentUser.role as Role;
  const targetRole = targetUserRole as Role;

  if (currentRole === 'SUPER_ADMIN') return true;
  if (currentRole === 'ADMIN' && targetRole !== 'SUPER_ADMIN') return true;
  if (currentRole === 'MANAGER' && ['STAFF', 'CUSTOMER'].includes(targetRole)) return true; // Optional: Managers can manage staff?

  return false;
};

export const isAdmin = (user: { role: string } | undefined | null) => hasRole(user, 'ADMIN');
export const isManager = (user: { role: string } | undefined | null) => hasRole(user, 'MANAGER');
export const isStaff = (user: { role: string } | undefined | null) => hasRole(user, 'STAFF');
