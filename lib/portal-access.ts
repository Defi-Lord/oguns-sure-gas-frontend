import type { AuthUser } from '@/types/auth';

export type Portal = 'admin' | 'staff' | 'rider';

export function canAccessPortal(user: AuthUser | null | undefined, portal: Portal): boolean {
  if (!user || user.status !== 'ACTIVE') return false;
  if (portal === 'rider') return user.role === 'RIDER';
  return portal === 'staff'
    ? user.role === 'STAFF'
    : user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_MANAGER';
}

export function portalHome(portal: Portal): string {
  if (portal === 'rider') return '/rider';
  return portal === 'staff' ? '/staff' : '/admin/dashboard';
}
