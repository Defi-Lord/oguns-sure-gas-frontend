'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { gasCaseLabel } from '@/components/shared/gas-discrepancy';
import { useAuthStore } from '@/stores/auth-store';
import type { DeliveriesResponse, Delivery } from '@/types/delivery';

export function useAdminDeliveries() {
  const user = useAuthStore((state) => state.user);
  const queryKey = ['admin-deliveries', user?.id, user?.managedBranch?.id] as const;
  const query = useQuery({
    queryKey,
    enabled: user?.role === 'BRANCH_MANAGER' || user?.role === 'SUPER_ADMIN',
    queryFn: async ({ signal }) => {
      const response = await api.get<DeliveriesResponse>('/deliveries', { signal });
      return response.data.data.deliveries ?? [];
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: 'always',
  });
  return { query, queryKey };
}

export function gasReturnQueueLabel(delivery: Delivery): string | null {
  const state = delivery.gasVerification?.discrepancyCase?.state;
  switch (state) {
    case 'RETURN_FOR_CORRECTION': return 'Awaiting branch receipt · correction';
    case 'RETURN_FOR_REFUND': return 'Awaiting branch receipt · customer decision';
    case 'RETURN_FOR_DECISION': return 'Awaiting branch receipt · customer decision';
    case 'AT_BRANCH_FOR_CORRECTION':
    case 'AT_BRANCH_FOR_DECISION': return gasCaseLabel(state);
    case 'REFUND_REVIEW': return 'Returned · handed to Finance for refund review';
    case 'CORRECTED': return delivery.status === 'PENDING' ? 'Corrected · assign rider for redelivery' : null;
    default: return null;
  }
}

const rowClass = 'block w-full rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-amber-400 dark:border-white/10';

export function GasReturnQueue({
  deliveries, pending, error, onOpen,
}: {
  deliveries: Delivery[];
  pending: boolean;
  error: unknown;
  onOpen?: (id: string) => void;
}) {
  const rows = deliveries.flatMap(delivery => {
    const label = gasReturnQueueLabel(delivery);
    return label ? [{ delivery, label }] : [];
  });

  return (
    <section id="gas-returns" aria-labelledby="gas-returns-title"
      className="space-y-3 rounded-[22px] border border-amber-200 p-4 dark:border-amber-500/30">
      <h2 id="gas-returns-title" className="font-semibold">Gas returns and corrections</h2>
      <div aria-live="polite" aria-atomic="true" className="text-sm">
        {error ? <p role="alert">{getApiErrorMessage(error)}</p>
          : pending ? <p>Checking gas returns…</p>
          : rows.length === 0 ? <p>No gas returns or corrections to review.</p>
          : <p>{rows.length} {rows.length === 1 ? 'case' : 'cases'} · Confirm receipt once the cylinder is back at the branch.</p>}
      </div>
      {rows.length > 0 && <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map(({ delivery, label }) => {
          const content = <><strong>{delivery.order.orderNumber}</strong><span className="block">{label}</span></>;
          return <li key={delivery.id}>{onOpen
            ? <button type="button" className={rowClass} onClick={() => onOpen(delivery.id)}>{content}</button>
            : <Link className={rowClass} href="/admin/deliveries#gas-returns">{content}</Link>}</li>;
        })}
      </ul>}
    </section>
  );
}

export function DashboardGasReturns() {
  const { query } = useAdminDeliveries();
  return <GasReturnQueue deliveries={query.data ?? []} pending={query.isPending} error={query.error} />;
}
