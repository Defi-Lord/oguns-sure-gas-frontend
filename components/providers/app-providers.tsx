'use client';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PushSessionRuntime } from '@/components/notifications/push-alerts';
import dynamic from 'next/dynamic';
import { WorkspaceRealtime } from './workspace-realtime';
import { useAuthStore } from '@/stores/auth-store';

const ExperienceMoments = dynamic(
  () => import('@/components/experience/experience-moments').then((module) => module.ExperienceMoments),
  { ssr: false },
);

interface AppProvidersProps {
  children: React.ReactNode;
}

function SessionQueryProvider({
  children,
}: AppProvidersProps) {
  const showMoments = useAuthStore(({ hasHydrated, isAuthenticated, user }) =>
    hasHydrated && isAuthenticated && user?.status === 'ACTIVE'
    && ['CUSTOMER', 'STAFF', 'RIDER'].includes(user.role),
  );
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
      <WorkspaceRealtime>
        {showMoments && <ExperienceMoments />}
        <PushSessionRuntime />
        {children}
      </WorkspaceRealtime>
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
