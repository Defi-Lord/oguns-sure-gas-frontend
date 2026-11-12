'use client';

import { DashboardGasReturns } from './gas-return-queue';
import { useAuthStore } from '@/stores/auth-store';
import { BranchManagerDashboard } from '@/components/admin/branch-manager/branch-manager-dashboard';
import { SuperAdminDashboard } from '@/components/admin/super-admin/super-admin-dashboard';

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'BRANCH_MANAGER') {
    return <><div className="pt-5"><DashboardGasReturns /></div><BranchManagerDashboard /></>;
  }

  return <>{user?.role === 'SUPER_ADMIN' && <div className="pt-5"><DashboardGasReturns /></div>}<SuperAdminDashboard /></>;
}