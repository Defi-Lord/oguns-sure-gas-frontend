import type { Metadata } from 'next';

export function portalAppMetadata(portal: 'admin' | 'rider' | 'staff'): Metadata {
  const label = { admin: 'Admin', rider: 'Rider', staff: 'Staff' }[portal];

  return {
    manifest: `/pwa/${portal}.webmanifest`,
    appleWebApp: {
      capable: true,
      title: `MySureGas ${label}`,
      statusBarStyle: 'default',
    },
  };
}
