import type { ReactNode } from 'react';
import { portalAppMetadata } from '@/lib/pwa/portal-metadata';

export const metadata = portalAppMetadata('rider');

export default function RiderPortalLayout({ children }: { children: ReactNode }) {
  return children;
}
