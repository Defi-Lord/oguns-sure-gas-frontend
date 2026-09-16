import type {
  ReactNode,
} from 'react';

import {
  AdminShell,
} from '@/components/admin/admin-shell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}
