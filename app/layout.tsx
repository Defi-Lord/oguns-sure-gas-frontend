import type {
  Metadata,
} from 'next';

import './globals.css';
import { CustomerEntrance } from '@/components/customer/customer-welcome';
import '@/components/shared/mobile-usability.css';
import { DeveloperCredit } from '@/components/shared/developer-credit';

import {
  AppProviders,
} from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: {
    default: "MySureGas",
    template: "%s | MySureGas",
  },
  description:
    "Cooking gas, cylinders and everyday essentials from your local MySureGas branch.",
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
          <CustomerEntrance/>
          {children}
          <DeveloperCredit />
        </AppProviders>
      </body>
    </html>
  );
}
