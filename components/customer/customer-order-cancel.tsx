'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import s from './customer.module.css';
import o from './customer-orders.module.css';

type Props = { owner: string; id: string; status: string; hasDelivery: boolean; paid: boolean };

export function CustomerOrderCancel({ owner, id, status, hasDelivery, paid }: Props) {
  const client = useQueryClient();
  const version = useAuthStore(state => state.sessionVersion);
  const lock = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const sameSession = () => {
    const auth = useAuthStore.getState();
    return auth.user?.id === owner && auth.user.role === 'CUSTOMER' &&
      auth.user.status === 'ACTIVE' && auth.sessionVersion === version;
  };
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['customer', 'order', owner, id] }),
      client.invalidateQueries({ queryKey: ['customer', 'orders', owner] }),
    ]);
  }
  async function cancel() {
    if (lock.current || !confirming || uncertain || !sameSession()) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await api.patch<{ data: { order: { id: string; status: string } } }>(`/orders/${encodeURIComponent(id)}/cancel`, {});
      if (!sameSession()) return;
      if (result.data.data.order.id !== id || result.data.data.order.status !== 'CANCELLED') {
        throw new Error('Cancellation could not be confirmed. Refresh the order status.');
      }
      setCancelled(true);
      setConfirming(false);
    } catch (reason) {
      if (sameSession()) {
        setError(getApiErrorMessage(reason));
        setUncertain(true);
        setConfirming(false);
      }
    } finally {
      if (sameSession()) {
        await refresh();
        setBusy(false);
      }
      lock.current = false;
    }
  }
  async function checkStatus() {
    if (lock.current || !sameSession()) return;
    lock.current = true;
    setBusy(true);
    try {
      await client.fetchQuery({
        queryKey: ['customer', 'order', owner, id], staleTime: 0,
        queryFn: async () => (await api.get<{ data: { order: { id: string; status: string } } }>(`/orders/${encodeURIComponent(id)}`)).data.data.order,
      });
      if (sameSession()) { setUncertain(false); setError(''); }
    } catch (reason) {
      if (sameSession()) setError(getApiErrorMessage(reason));
    } finally { lock.current = false; setBusy(false); }
  }
  const stopped = cancelled || status === 'CANCELLED';
  const eligible = ['PENDING', 'CONFIRMED'].includes(status) && !hasDelivery;
  return <section className={o.panel} aria-label="Order cancellation">
    <h2>{stopped ? 'Order cancelled' : 'Need to cancel?'}</h2>
    {stopped ? <p role="status">Your order is cancelled. {paid ? 'Any refund is reviewed separately by our team. Cancellation does not mean your refund has completed.' : 'Contact your branch if you need help with a payment.'}</p> : <>
      <p>{eligible ? 'You can cancel before preparation starts and before a delivery is assigned.' : 'Online cancellation is unavailable at this stage. Contact your branch or use order support for help.'}</p>
      {paid && eligible && <p>Your payment will be reviewed separately for a refund. Cancelling does not immediately return your payment.</p>}
      {error && <p className={s.error} role="alert">{error}</p>}
      {uncertain ? <><p>Check the latest order status before trying again.</p><button className={s.button} disabled={busy} onClick={() => void checkStatus()}>{busy ? 'Checking…' : 'Check order status'}</button></> : eligible && (confirming ? <div>
        <p><strong>Cancel this order?</strong> This cannot be undone.</p>
        <button className={s.button} disabled={busy} onClick={() => void cancel()}>{busy ? 'Cancelling…' : 'Yes, cancel order'}</button>{' '}
        <button className={s.button} disabled={busy} onClick={() => setConfirming(false)}>Keep my order</button>
      </div> : <button className={s.button} disabled={busy} onClick={() => setConfirming(true)}>Cancel order</button>)}
    </>}
  </section>;
}
