'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Heart, Loader2 } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { announceMoment } from '@/lib/experience/moment-policy';
import { MomentAmount } from '@/components/experience/moment-artwork';
import s from '@/components/experience/experience-moments.module.css';
type Appreciation = { customerName: string; orderNumber: string; amount: string; netAmount: string; thanked: boolean };
export function RiderTipAppreciation({ tipId, celebration = false }: { tipId: string; celebration?: boolean }) {
  const user = useAuthStore(state => state.user), client = useQueryClient();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const lock = useRef(false);
  const key = ['rider', 'tip-appreciation', user?.id, tipId];
  const q = useQuery({ queryKey: key, queryFn: async ({ signal }) => (await api.get<{ data: Appreciation }>(`/rider-tips/${encodeURIComponent(tipId)}/appreciation`, { signal })).data.data, enabled: user?.role === 'RIDER', retry: false, staleTime: 30000 });
  async function send() {
    if (lock.current || !user || !q.data || q.data.thanked) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const data = (await api.post<{ data: Appreciation }>(`/rider-tips/${encodeURIComponent(tipId)}/appreciation`, {})).data.data;
      if (useAuthStore.getState().user?.id !== user.id) return;
      client.setQueryData(key, data);
      announceMoment(user.id, { key: `sent-thanks:${tipId}`, kind: 'thanks', title: 'Good energy, sent!', message: `Your thank-you for ${data.orderNumber} has been sent to ${data.customerName}.`, duration: 3000 });
    } catch (e) { setError(getApiErrorMessage(e)); } finally { lock.current = false; setBusy(false); }
  }
  if (q.isPending) return <p className={s.tipDetail} role="status">Loading your customer’s thank-you…</p>;
  if (q.isError) return <div className={s.tipDetail}><p>Tip details couldn’t load.</p><button className={s.smallButton} onClick={() => void q.refetch()}>Retry tip details</button></div>;
  return <div className={s.appreciation}><p><strong>{q.data?.customerName}</strong> tipped you {celebration?'':`₦${Number(q.data?.amount).toLocaleString('en-NG')} `}for <strong>{q.data?.orderNumber}</strong>.</p>{celebration&&q.data&&<MomentAmount value={q.data.amount}/>}<small>Wallet credit: ₦{Number(q.data?.netAmount).toLocaleString('en-NG')} after the 3% platform fee.</small><button className={s.thankButton} disabled={busy || q.data?.thanked} onClick={() => void send()}>{busy ? <Loader2 size={16} /> : q.data?.thanked ? <Check size={16} /> : <Heart size={16} />} {q.data?.thanked ? 'Thank-you sent' : 'Send a thank-you'}</button>{error && <p role="alert">{error} You can safely retry.</p>}</div>;
}
