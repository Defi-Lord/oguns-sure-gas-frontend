import type { ReactNode } from 'react';
import { portalAppMetadata } from '@/lib/pwa/portal-metadata';

export const metadata = portalAppMetadata('staff');

export default function StaffPortalLayout({ children }: { children: ReactNode }) {
  return children;
}
