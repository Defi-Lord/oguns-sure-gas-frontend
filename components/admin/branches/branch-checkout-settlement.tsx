'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, getApiErrorMessage } from '@/lib/api/client';

type Connection = {
  routingEnabled: boolean;
  mainBranch: boolean;
  code: string | null;
  verifiedAt: string | null;
};

type Destination = {
  code: string;
  domain: 'test' | 'live';
  accountName: string;
  bankName: string;
  lastFour: string;
  fingerprint: string;
};

export function BranchCheckoutSettlement({ branchId }: { branchId: string }) {
  const [code, setCode] = useState('');
  const [destination, setDestination] = useState<Destination | null>(null);
  const queryClient = useQueryClient();
  const path = `/branches/management/${branchId}/checkout-settlement`;
  const queryKey = ['branch-checkout-settlement', branchId];
  const connection = useQuery({
    queryKey,
    queryFn: async () => (await api.get<{ data: Connection }>(path)).data.data,
    retry: false,
  });
  const verify = useMutation({
    mutationFn: async (input: string) =>
      (await api.post<{ data: Destination }>(`${path}/verify`, { code: input })).data.data,
    onSuccess: setDestination,
  });
  const connect = useMutation({
    mutationFn: async ({ code, fingerprint }: Destination) =>
      (await api.put<{ data: Connection }>(path, { code, fingerprint })).data.data,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      setDestination(null);
      setCode('');
    },
  });
  const busy = verify.isPending || connect.isPending;
  const error = connect.error ?? verify.error;

  return (
    <section className="space-y-4 rounded-[24px] border border-slate-200/80 bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Paystack checkout settlement</h3>
        <p className="mt-1 text-sm text-slate-600">Choose the account that receives this branch’s online sales.</p>
      </div>
      {connection.isPending ? <p className="text-sm text-slate-600">Checking settlement setup…</p> : null}
      {connection.isError ? (
        <p role="alert" className="text-sm text-rose-700">{getApiErrorMessage(connection.error)}</p>
      ) : null}
      {connection.data?.mainBranch ? (
        <p className="text-sm font-medium text-slate-800">Main branch · Paystack merchant bank account</p>
      ) : null}
      {connection.data && !connection.data.mainBranch ? (
        <>
          <p className="text-sm font-medium text-slate-800">
            {connection.data.code ? `Connected: ${connection.data.code}` : 'No subaccount connected'}
          </p>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
            event.preventDefault();
            setDestination(null);
            connect.reset();
            verify.mutate(code.trim());
          }}>
            <label className="grid min-w-48 flex-1 gap-1 text-sm text-slate-700">
              Paystack subaccount code
              <Input value={code} onChange={(event) => {
                setCode(event.target.value);
                setDestination(null);
                verify.reset();
                connect.reset();
              }} disabled={busy} placeholder="ACCT_…" maxLength={69} autoComplete="off" />
            </label>
            <Button type="submit" variant="outline" disabled={busy || !/^ACCT_[A-Za-z0-9]{1,64}$/.test(code.trim())}>
              {verify.isPending ? 'Verifying…' : 'Verify destination'}
            </Button>
          </form>
          {destination ? (
            <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-800">
              <p className="font-semibold">{destination.accountName}</p>
              <p>{destination.bankName} · Account ending {destination.lastFour} · {destination.domain === 'live' ? 'Live' : 'Test'} mode</p>
              <p>The main account receives 0% of these sales. The branch bears Paystack’s processing fee.</p>
              <Button type="button" disabled={busy} onClick={() => connect.mutate(destination)}>
                {connect.isPending ? 'Connecting…' : 'Confirm and connect'}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      {connection.data && !connection.data.routingEnabled ? (
        <p className="text-sm text-amber-800">Branch routing is off. A connected branch cannot take online payments until routing is enabled.</p>
      ) : connection.data && !connection.data.mainBranch && !connection.data.code ? (
        <p className="text-sm text-amber-800">Online payments are unavailable until a subaccount is connected.</p>
      ) : null}
      {error ? <p role="alert" className="text-sm text-rose-700">{getApiErrorMessage(error)}</p> : null}
      {connect.isSuccess ? <p role="status" className="text-sm text-emerald-800">Settlement destination saved.</p> : null}
    </section>
  );
}
