'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GasDiscrepancy } from '@/components/shared/gas-discrepancy';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import type { GasVerification } from '@/types/delivery';
import { StaffDispatch } from './staff-dispatch';

type GasReturn = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paid: boolean;
  gas: Pick<GasVerification, 'discrepancyCase' | 'expectedGasKg' | 'gasSuppliedKg' | 'deliveryWeightKg'>;
};

export function StaffGasReturns({ summary = false }: { summary?: boolean }) {
  const userId = useAuthStore(state => state.user?.id);
  const version = useAuthStore(state => state.sessionVersion);
  const client = useQueryClient();
  const queue = useQuery({
    queryKey: ['staff', 'gas-returns', userId, version],
    enabled: Boolean(userId),
    queryFn: async ({ signal }) => (await api.get<{ data: { returns: GasReturn[] } }>('/deliveries/gas-returns', { signal })).data.data.returns,
    refetchInterval: 10_000,
    refetchOnWindowFocus: 'always',
  });

  async function refresh() {
    await Promise.all([
      queue.refetch(),
      client.invalidateQueries({ queryKey: ['staff', 'orders', userId] }),
      client.invalidateQueries({ queryKey: ['staff', 'available-riders', userId] }),
    ]);
  }

  return <section id="gas-returns" aria-labelledby="staff-gas-returns-title"
    className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-50/60 p-4 dark:bg-amber-950/20">
    <h2 id="staff-gas-returns-title" className="font-semibold">Gas returns and corrections</h2>
    {queue.isError ? <p role="alert">{getApiErrorMessage(queue.error)} <button type="button" className="underline" onClick={() => void queue.refetch()}>Retry</button></p>
      : queue.isPending ? <p role="status">Checking branch returns…</p>
      : !queue.data.length ? <p>No gas returns to handle at your branch.</p>
      : summary ? <Link className="underline" href="/staff/orders#gas-returns">Open gas returns ({queue.data.length})</Link>
      : queue.data.map(item => <article key={item.id} className="rounded-xl border border-amber-500/30 p-4">
        <h3 className="font-semibold">{item.orderNumber}</h3>
        <GasDiscrepancy deliveryId={item.id} orderId={item.orderId} gas={item.gas} audience="staff" refresh={refresh} />
        {item.orderStatus === 'READY_FOR_PICKUP' && <StaffDispatch orderId={item.orderId} status={item.orderStatus} paid={item.paid} onUpdated={refresh} />}
      </article>)}
  </section>;
}
