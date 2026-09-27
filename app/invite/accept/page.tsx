import {
  Suspense,
} from 'react';

import {
  AcceptManagedInvite,
} from '@/components/provisioning/accept-managed-invite';

export default function ManagedInviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto h-80 max-w-xl animate-pulse rounded-[32px] bg-white" />
        </main>
      }
    >
      <AcceptManagedInvite />
    </Suspense>
  );
}