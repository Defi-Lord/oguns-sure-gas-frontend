'use client';

import { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { announceMoment } from '@/lib/experience/moment-policy';
import { useAuthStore } from '@/stores/auth-store';
import type { GasVerification } from '@/types/delivery';

type Action = 'ACCEPT' | 'RETURN_COMPLETE' | 'RETURN_REFUND' | 'ESCALATE' | 'CONFIRM_RETURN' | 'REWEIGH';
const actionLabels: Record<Action, string> = {
  ACCEPT: 'Accept measured amount',
  RETURN_COMPLETE: 'Return to complete my order',
  RETURN_REFUND: 'Return and request a refund',
  ESCALATE: 'Ask rider to return to branch',
  CONFIRM_RETURN: 'Confirm branch received the order',
  REWEIGH: 'Verify corrected weight and release for dispatch',
};

export function gasCaseLabel(state: string | null | undefined) {
  switch (state) {
    case 'AWAITING_CUSTOMER': return 'Awaiting customer decision';
    case 'ACCEPTED': return 'Measured amount accepted';
    case 'RETURN_FOR_CORRECTION': return 'Returning to branch for correction';
    case 'RETURN_FOR_REFUND': return 'Returning to branch for refund review';
    case 'RETURN_FOR_DECISION': return 'Returning to branch while decision is pending';
    case 'AT_BRANCH_FOR_CORRECTION': return 'At branch for correction';
    case 'AT_BRANCH_FOR_DECISION': return 'At branch, awaiting customer decision';
    case 'CORRECTED': return 'Weight corrected';
    case 'REFUND_REVIEW': return 'Refund requested · awaiting review';
    default: return 'Weight discrepancy';
  }
}

type Props = { deliveryId: string; orderId: string; gas: GasVerification;
  audience: 'customer' | 'management'; total?: string; refunded?: boolean; refresh: () => Promise<unknown> };

export function GasDiscrepancy({ deliveryId, orderId, gas, audience, total, refunded, refresh }: Props) {
  const item = gas.discrepancyCase;
  const lock = useRef(false);
  const [intent, setIntent] = useState<{ action: Action; version: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [weight, setWeight] = useState('');
  if (!item?.state) return null;

  const customer = audience === 'customer';
  const awaiting = item.state === 'AWAITING_CUSTOMER' || item.state === 'AT_BRANCH_FOR_DECISION';
  const returning = ['RETURN_FOR_CORRECTION', 'RETURN_FOR_REFUND', 'RETURN_FOR_DECISION'].includes(item.state);
  const actions: Action[] = customer
    ? awaiting ? [...(item.canAccept ? ['ACCEPT' as const] : []), 'RETURN_COMPLETE', 'RETURN_REFUND'] : []
    : returning ? ['CONFIRM_RETURN'] : item.state === 'AT_BRANCH_FOR_CORRECTION' ? ['REWEIGH']
    : item.state === 'AWAITING_CUSTOMER' && item.expired ? ['ESCALATE'] : [];
  const review = intent?.version === item.version && actions.includes(intent.action) ? intent.action : null;
  const quantity = (kg: number | null) => kg == null ? 'Unavailable' : `${kg.toFixed(3)} kg`;

  async function submit(action: Action, version: string) {
    const session = useAuthStore.getState();
    const owner = session.user?.id;
    if (lock.current || !owner || session.user?.status !== 'ACTIVE') return;
    const sameSession = () => {
      const now = useAuthStore.getState();
      return now.user?.id === owner && now.sessionVersion === session.sessionVersion;
    };
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { data } = await api.patch<{data:{state:string}}>(
        `/deliveries/${encodeURIComponent(deliveryId)}/gas-verification/discrepancy`,
        { action, version, ...(action === 'REWEIGH' ? { finalWeightKg: weight.trim() } : {}) },
      );
      if (!sameSession()) return;
      setIntent(null);
      setNotice(gasCaseLabel(data.data.state));
      announceMoment(owner, { key: `GAS:decision:${orderId}:${version}`, kind: 'gentle',
        title: 'Saved', message: gasCaseLabel(data.data.state), duration: 1800 });
    } catch (reason) {
      if (sameSession()) {
        setError(getApiErrorMessage(reason));
        setIntent(null);
      }
    } finally {
      try { if (sameSession()) await refresh(); } catch { /* Refetch errors are shown by the parent. */ }
      finally { lock.current = false; if (sameSession()) setBusy(false); }
    }
  }

  const button = 'rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold disabled:opacity-50';
  return <section aria-label="Gas weight resolution" aria-busy={busy}
    className="my-4 space-y-3 rounded-2xl border border-amber-500/50 bg-amber-50/60 p-4 text-sm text-slate-900 dark:bg-amber-950/40 dark:text-slate-100">
    <h3 className="flex items-center gap-2 font-semibold"><AlertCircle size={17} aria-hidden="true"/>
      {customer && awaiting ? 'Your decision is needed' : item.state === 'REFUND_REVIEW' && refunded ? 'Refund completed' : gasCaseLabel(item.state)}</h3>
    <p>Ordered: <strong>{quantity(gas.expectedGasKg)}</strong> · Measured: <strong>{quantity(gas.gasSuppliedKg)}</strong></p>
    {customer && awaiting && <p>{item.canAccept
      ? `Accepting the measured amount keeps the order total at ${total}. No price adjustment applies.`
      : 'The measured amount cannot be accepted at the current price. Choose a return for correction or request a refund.'}</p>}
    {returning && <p>The branch must confirm it physically received the order before the rider is released.</p>}
    {item.state === 'REFUND_REVIEW' && <p>{refunded ? 'Your payment refund has been processed.' : 'The branch has received the order. Your refund has been requested.'}</p>}
    {!customer && item.state === 'AWAITING_CUSTOMER' && item.deadline && <p>Decision deadline: {new Date(item.deadline).toLocaleString('en-NG')}</p>}
    {actions.includes('REWEIGH') && <label className="block">Corrected gross cylinder weight (kg)
      <input className="ml-2 rounded border px-2 py-1 dark:bg-slate-900" type="text" inputMode="decimal"
        value={weight} onChange={event => { setWeight(event.target.value); setIntent(null); }} disabled={busy}/>
    </label>}
    {error && <p role="alert">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!review && <div className="flex flex-wrap gap-2">{actions.map(action => <button key={action} type="button"
      className={button} disabled={busy || action === 'REWEIGH' && !/^\d{1,9}(?:\.\d{1,3})?$/.test(weight.trim())}
      onClick={() => setIntent({ action, version: item.version })}>{actionLabels[action]}</button>)}</div>}
    {review && <div className="space-y-2">
      <p>{actionLabels[review]}? {review === 'CONFIRM_RETURN' ? 'Confirm only after the physical handoff.'
        : review === 'RETURN_REFUND' ? 'Refund review begins after the branch receives the order.' : ''}</p>
      <div className="flex flex-wrap gap-2">
        <button className={button} type="button" disabled={busy} onClick={() => setIntent(null)}>Go back</button>
        <button className={button} type="button" disabled={busy} onClick={() => void submit(review, item.version)}>
          {busy ? 'Saving…' : 'Confirm and save'}</button>
      </div>
    </div>}
  </section>;
}
