import type {
  Metadata,
  Viewport,
} from 'next';

import './globals.css';
import { CustomerEntrance } from '@/components/customer/customer-welcome';
import '@/components/shared/mobile-usability.css';
import { DeveloperCredit } from '@/components/shared/developer-credit';

import {
  AppProviders,
} from '@/components/providers/app-providers';

export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#fffef9'};

export const metadata: Metadata = {
  manifest:'/manifest.webmanifest',
  appleWebApp:{capable:true,title:'MySureGas',statusBarStyle:'default'},
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
