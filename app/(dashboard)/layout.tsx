import type {
  ReactNode,
} from 'react';

import {
  AdminShell,
} from '@/components/admin/admin-shell';
import { portalAppMetadata } from '@/lib/pwa/portal-metadata';

export const metadata = portalAppMetadata('admin');

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
