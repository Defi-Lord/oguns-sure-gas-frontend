'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import styles from './refund-panel.module.css';

type Withdrawal = {
  id: string;
  riderName: string;
  amount: string;
  status: 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';
  bankName: string;
  accountLast4: string;
  accountName: string;
  reference: string;
  needsApproval: boolean;
  providerStatus: string;
};
type Queue = { page: number; pageSize: number; total: number; withdrawals: Withdrawal[] };

const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' });

export function RiderWithdrawalsPanel() {
  const user = useAuthStore(state => state.user);
  if (user?.role !== 'SUPER_ADMIN') return null;
  return <WithdrawalReview key={user.id} userId={user.id} />;
}

function WithdrawalReview({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const queue = useQuery({
    queryKey: ['finance-rider-withdrawals', userId, page],
    queryFn: async ({ signal }) =>
      (await api.get<{ data: Queue }>('/rider-wallet/admin/withdrawals', { params: { page }, signal })).data.data,
    refetchInterval: 30_000,
    retry: false,
  });

  async function reload() {
    const { data } = await queue.refetch();
    if (data && data.withdrawals.length === 0 && page > 1) setPage(page - 1);
  }

  async function updateWithdrawal(id: string, approval?: string) {
    setBusy(true);
    setError('');
    setMessage('');
    setOtp('');
    try {
      const { data } = await api.post<{ data: { data?: Withdrawal } }>(
        approval ? `/rider-wallet/withdrawals/${id}/finalize-otp` : `/rider-wallet/admin/withdrawals/${id}/refresh`,
        approval ? { otp: approval } : {},
      );
      const result = data.data.data;
      if (!result) setMessage('No verified transfer status was returned. Check the reference in Paystack.');
      else if (result.status === 'PAID') setMessage('Paystack confirmed the bank transfer.');
      else if (result.status === 'FAILED' || result.status === 'REVERSED') {
        setMessage('Paystack confirmed the transfer did not complete. The withdrawal amount was released to the wallet.');
      } else if (result.needsApproval) setMessage('Paystack is waiting for transfer approval.');
      else setMessage('The bank transfer is still processing.');
      setSelected(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      await reload();
      setBusy(false);
    }
  }

  function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected && !busy) void updateWithdrawal(selected.id, otp);
  }

  return (
    <section className={styles.panel} aria-labelledby="rider-withdrawals-heading">
      <header>
        <div>
          <h2 id="rider-withdrawals-heading">Rider wallet withdrawals</h2>
          <p>Check transfers to riders’ verified bank accounts and approve them when Paystack asks for an OTP.</p>
        </div>
        <button type="button" disabled={busy || queue.isFetching} onClick={() => void reload()}>Refresh list</button>
      </header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {selected && (
        <form className={styles.review} onSubmit={approve}>
          <h3>Approve bank transfer</h3>
          <p>{selected.riderName} · {selected.bankName} · •••• {selected.accountLast4}</p>
          <p>{currency.format(Number(selected.amount))} · {selected.reference}</p>
          <label>
            Paystack transfer OTP
            <input className="ml-2 rounded border border-emerald-200 p-2" type="text" inputMode="numeric"
              autoComplete="off" pattern="[0-9]{4,10}" maxLength={10} required value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g, ''))} disabled={busy} />
          </label>
          <div className={styles.actions}>
            <button type="button" disabled={busy} onClick={() => { setSelected(null); setOtp(''); }}>Cancel</button>
            <button type="submit" className={styles.primary} disabled={busy || otp.length < 4}>Approve transfer</button>
          </div>
        </form>
      )}
      {queue.isPending ? <p role="status">Loading withdrawals…</p> : queue.isError ? (
        <p className={styles.error} role="alert">{getApiErrorMessage(queue.error)}</p>
      ) : queue.data.withdrawals.length === 0 ? <p>No rider withdrawals are waiting.</p> : (
        <>
          <div className={styles.table}>
            <table>
              <thead><tr><th>Rider / destination</th><th>Amount</th><th>Transfer status</th><th>Action</th></tr></thead>
              <tbody>
                {queue.data.withdrawals.map(withdrawal => (
                  <tr key={withdrawal.id}>
                    <td><strong>{withdrawal.riderName}</strong><small>{withdrawal.accountName} · {withdrawal.bankName} · •••• {withdrawal.accountLast4}</small><small>{withdrawal.reference}</small></td>
                    <td>{currency.format(Number(withdrawal.amount))}</td>
                    <td>{withdrawal.needsApproval ? 'Awaiting Paystack OTP' :
                      ['initiating', 'initiation_uncertain'].includes(withdrawal.providerStatus) ? 'Waiting for provider verification' : 'Processing'}</td>
                    <td>
                      {withdrawal.needsApproval && <button type="button" disabled={busy} onClick={() => {
                        setSelected(withdrawal); setOtp(''); setError(''); setMessage('');
                      }}>Enter Paystack OTP</button>}
                      {' '}
                      <button type="button" disabled={busy} onClick={() => void updateWithdrawal(withdrawal.id)}>Check Paystack status</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <button type="button" disabled={busy || page === 1} onClick={() => { setSelected(null); setOtp(''); setPage(page - 1); }}>Previous</button>
            <span>Page {page}</span>
            <button type="button" disabled={busy || page * queue.data.pageSize >= queue.data.total}
              onClick={() => { setSelected(null); setOtp(''); setPage(page + 1); }}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
