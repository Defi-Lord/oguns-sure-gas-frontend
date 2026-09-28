'use client';

import { useAuthStore } from '@/stores/auth-store';
import { BranchManagerDashboard } from '@/components/admin/branch-manager/branch-manager-dashboard';
import { SuperAdminDashboard } from '@/components/admin/super-admin/super-admin-dashboard';

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'BRANCH_MANAGER') {
    return <BranchManagerDashboard />;
  }

  return <SuperAdminDashboard />;
}