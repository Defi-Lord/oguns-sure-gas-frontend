'use client';
import { announceMoment } from '@/lib/experience/moment-policy';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Bell, Camera, CheckCircle2, Gift, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import { StaffQrScanner } from './staff-qr-scanner';
import { useAuthStore } from '@/stores/auth-store';

const card = 'rounded-3xl border border-[#dfe6d8] bg-white p-6 sm:p-8';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
const primary = `${button} !border-emerald-800 !bg-emerald-800 !text-white hover:!bg-emerald-900`;
function date(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Time unavailable' : d.toLocaleString('en-NG'); }
function ErrorNotice({ error }: { error: unknown }) { return <p role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{getApiErrorMessage(error)}</p>; }
function useInboxCount() {
  const id = useAuthStore(state => state.user?.id);
  return useQuery({ queryKey: ['staff', 'notifications', id, 'count'], queryFn: getUnreadNotificationCount, refetchInterval: 30_000 });
}

export function StaffDashboard() {
  const name = useAuthStore(state => state.user?.firstName);
  const unread = useInboxCount();
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">Staff workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Ready for the day, {name}?</h1><p className="mt-3 text-sm text-slate-600">Redeem customer rewards and keep up with your notifications.</p></header>
    <div className="grid gap-5 md:grid-cols-2">
      <Link href="/staff/redeem" className={`${card} group !border-emerald-800 !bg-emerald-900 !text-white transition-transform motion-safe:hover:-translate-y-1`}><Gift size={30} className="text-lime-200" /><h2 className="mt-6 text-2xl font-semibold">Redeem a voucher</h2><p className="mt-3 text-sm leading-7 text-emerald-100">Enter a customer’s giveaway code or QR token and record redemption at your assigned branch.</p><span className="mt-6 inline-flex items-center gap-2 font-semibold text-lime-200">Start redemption <ArrowUpRight size={18} /></span></Link>
      <Link href="/staff/notifications" className={`${card} transition-transform motion-safe:hover:-translate-y-1`}><Bell size={30} className="text-emerald-700" /><h2 className="mt-6 text-2xl font-semibold">Your notifications</h2><p className="mt-3 text-sm leading-7 text-slate-600">{unread.isPending ? 'Checking unread messages…' : unread.isError ? 'Open your inbox to retry loading notifications.' : `${unread.data} unread ${unread.data === 1 ? 'notification' : 'notifications'}`}</p><span className="mt-6 inline-flex items-center gap-2 font-semibold text-emerald-800">Open inbox <ArrowUpRight size={18} /></span></Link>
    </div>
    <section className={card}><div className="flex items-start gap-4"><ShieldCheck className="shrink-0 text-emerald-700" /><div><h2 className="font-semibold">Redemption stays with your branch</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Your staff assignment determines where a voucher is redeemed. Check the result before handing over a reward. Your manager handles order-status changes and stock adjustments.</p></div></div></section>
  </div>;
}

type Receipt = { voucher: { code: string; rewardName: string; rewardDescription: string | null; rewardQuantity: number | null; status: string }; redemption: { id: string; redeemedAt: string; branch: { name: string; code: string } } };
export function StaffRedeem() {
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState(false);
  const [mode, setMode] = useState<'code' | 'qrToken'>('code');
  const [value, setValue] = useState('');
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const lock = useRef(false);
  function prepare(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!value.trim()) return; setScanning(false); setError(null); setReview(true); }
  async function redeem() {
    if (lock.current) return;
    lock.current = true; setPending(true); setError(null);
    try {
      const actorId=useAuthStore.getState().user?.id;
      const response = await api.post<{ data: Receipt }>('/vouchers/redeem', { [mode]: value.trim() }, { timeout: 45_000 });
      setReceipt(response.data.data);const owner=useAuthStore.getState().user;if(owner?.role==='STAFF'&&owner.id===actorId)announceMoment(owner.id,{key:`redeemed:${response.data.data.redemption.id}`,kind:'success',title:'Reward redeemed!',message:`${response.data.data.voucher.rewardName} · Redemption recorded successfully.`,duration:3000}); setScanNotice(false); setValue(''); setReview(false);
    } catch (cause) { setError(cause); setReview(false); }
    finally { lock.current = false; setPending(false); }
  }
  if (receipt) return <section className={`${card} mx-auto max-w-3xl`}><div role="status"><CheckCircle2 className="size-12 text-emerald-700" /><h1 className="mt-5 text-3xl font-semibold">Voucher redeemed</h1><p className="mt-3 text-sm text-slate-600">The redemption has been recorded successfully.</p></div><dl className="mt-7 grid gap-6 sm:grid-cols-2">{[['Reward', receipt.voucher.rewardName], ['Quantity', receipt.voucher.rewardQuantity == null ? 'Not specified' : String(receipt.voucher.rewardQuantity)], ['Voucher', receipt.voucher.code], ['Branch', `${receipt.redemption.branch.name} (${receipt.redemption.branch.code})`], ['Redeemed at', date(receipt.redemption.redeemedAt)], ['Reference', receipt.redemption.id]].map(([label, content]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 break-words font-semibold">{content}</dd></div>)}</dl>{receipt.voucher.rewardDescription && <p className="mt-6 text-sm text-slate-600">{receipt.voucher.rewardDescription}</p>}<p className="my-6 text-xs leading-6 text-slate-500">Save the reference if needed before leaving this page. This screen shows the redemption just completed.</p><button className={primary} onClick={() => setReceipt(null)}>Redeem another voucher</button></section>;
  return <div className="mx-auto max-w-3xl space-y-6"><header><h1 className="text-3xl font-semibold">Redeem a voucher</h1><p className="mt-3 text-sm leading-7 text-slate-600">Scan the customer’s QR code, upload a QR image, or enter their voucher details.</p></header><section className={card}>
    <div className="mb-6 flex flex-wrap gap-2">{(['code','qrToken'] as const).map(option => <button key={option} disabled={pending || review} aria-pressed={mode === option} className={mode === option ? primary : button} onClick={() => { setMode(option); setScanNotice(false); setValue(''); setError(null); }}>{option === 'code' ? 'Voucher code' : 'QR token'}</button>)}<button type="button" disabled={pending || review} className={button} onClick={() => {setScanning(true);setScanNotice(false);}}><Camera size={17} /> Scan QR code</button></div>{scanning && !review && <StaffQrScanner onClose={() => setScanning(false)} onDetected={token => {setMode('qrToken');setValue(token);setScanning(false);setScanNotice(true);setError(null);}} />}{scanNotice && <p role="status" className="mb-5 rounded-xl border border-lime-200 bg-lime-50 p-4 text-sm text-emerald-800">QR token captured. Review it below, then confirm when ready to issue the reward.</p>}
    {error != null && <><ErrorNotice error={error} /><p className="mb-4 text-xs leading-6 text-slate-600">If the connection failed, the outcome may be uncertain. Ask your manager to check the voucher’s redemption record before retrying or handing over a reward.</p></>}
    {!review ? <form onSubmit={prepare}><label htmlFor="voucher-input" className="text-sm font-semibold">{mode === 'code' ? 'Voucher code' : 'QR token'}</label><input id="voucher-input" autoComplete="off" spellCheck={false} required value={value} disabled={pending} onChange={event => {setValue(event.target.value);setScanNotice(false);}} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900" /><button disabled={pending || !value.trim()} className={`${primary} mt-5`} type="submit">Review redemption</button></form> : <div><h2 className="text-xl font-semibold">Confirm redemption</h2><p className="my-4 break-all rounded-xl bg-slate-50 p-4 font-mono text-sm">{value.trim()}</p><p className="mb-5 text-sm leading-7 text-slate-600">Confirming checks and redeems this voucher at your assigned branch. This is not a preview or eligibility check. Only continue when ready to issue the reward.</p><div className="flex flex-wrap gap-3"><button className={primary} disabled={pending} onClick={() => void redeem()}>{pending ? 'Redeeming…' : 'Confirm and redeem'}</button><button className={button} disabled={pending} onClick={() => setReview(false)}>Back</button></div></div>}
  </section><p className="text-xs leading-6 text-slate-500">Already redeemed, expired, and invalid vouchers are rejected by the backend. Camera access requires HTTPS or localhost. You can also upload a QR image or enter the code/token manually.</p></div>;
}

export { StaffInbox as StaffNotifications } from './staff-inbox';
