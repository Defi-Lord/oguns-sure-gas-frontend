'use client';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface AppProvidersProps {
  children: React.ReactNode;
}

function SessionQueryProvider({
  children,
}: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => () => queryClient.clear(), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Each login and authorization scope receives a new cache before its children render.
// Access-token refresh and ordinary profile edits keep the current cache.
export function AppProviders({ children }: AppProvidersProps) {
  const sessionKey = useAuthStore((state) => JSON.stringify([
    state.sessionVersion,
    state.isAuthenticated,
    state.user?.id ?? null,
    state.user?.role ?? null,
    state.user?.status ?? null,
    state.user?.managedBranch?.id ?? null,
  ]));

  return (
    <SessionQueryProvider key={sessionKey}>
      {children}
    </SessionQueryProvider>
  );
}
