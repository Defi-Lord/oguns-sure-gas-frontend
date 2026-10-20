import type {
  Metadata,
} from 'next';

import './globals.css';
import '@/components/shared/mobile-usability.css';
import { DeveloperCredit } from '@/components/shared/developer-credit';

import {
  AppProviders,
} from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: {
    default: "MySureGas Admin",
    template: "%s | MySureGas",
  },
  description:
    "MySureGas administration and operations command center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <AppProviders>
          {children}
          <DeveloperCredit />
        </AppProviders>
      </body>
    </html>
  );
}
