import type {
  Metadata,
} from 'next';

import './globals.css';

import {
  AppProviders,
} from '@/components/providers/app-providers';

export const metadata: Metadata = {
  title: {
    default: "Ogun's Sure Gas Admin",
    template: "%s | Ogun's Sure Gas",
  },
  description:
    "Ogun's Sure Gas administration and operations command center.",
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
        </AppProviders>
      </body>
    </html>
  );
}
