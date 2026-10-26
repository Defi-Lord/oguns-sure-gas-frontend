'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { getNotifications } from '@/lib/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { createMomentQueue, notificationMoment, type Moment } from '@/lib/experience/moment-policy';
import { RiderTipAppreciation } from '@/components/rider/rider-tip-appreciation';
import s from './experience-moments.module.css';
import { MomentArtwork, MomentParticles, MomentAmount, momentScene } from './moment-artwork';
const empty: Moment[] = [];
export function ExperienceMoments() {
  const { user, hasHydrated, isAuthenticated, sessionVersion } = useAuthStore(); const path = usePathname();
  if (!hasHydrated || !isAuthenticated || user?.status !== 'ACTIVE' || !['RIDER', 'CUSTOMER', 'STAFF'].includes(user.role)) return null;
  if (!(user.role === 'RIDER' ? path.startsWith('/rider') : user.role === 'STAFF' ? path.startsWith('/staff') : path.startsWith('/shop'))) return null;
  return <MomentSession key={`${user.id}:${sessionVersion}`} owner={user.id} role={user.role} />;
}
function MomentSession({ owner, role }: { owner: string; role: string }) {
  const [store] = useState(createMomentQueue); const list = useSyncExternalStore(store.subscribe, store.get, () => empty);
  const seen = useRef<Set<string> | null>(null), started = useRef(false);
  const query = useQuery({ queryKey: [role.toLowerCase(), 'moments', owner], queryFn: () => getNotifications({ limit: 60 }), enabled: role !== 'STAFF', refetchInterval: 10000, refetchOnWindowFocus: true, retry: false });
  useEffect(() => {
    const listener = (event: Event) => { const detail = (event as CustomEvent<{ owner: string; moment: Moment }>).detail; if (detail?.owner === owner) {
      if (!seen.current) { try { seen.current = new Set(JSON.parse(localStorage.getItem(`mysuregas:moments:${owner}`) || '[]')); } catch { seen.current = new Set(); } }
      const semantic = `milestone:${detail.moment.key}`;
      if (!seen.current.has(semantic)) { seen.current.add(semantic); store.add(detail.moment); }
      try { localStorage.setItem(`mysuregas:moments:${owner}`, JSON.stringify([...seen.current].slice(-600))); } catch { /* Current session remains deduplicated. */ }
    } };
    window.addEventListener('mysuregas:moment', listener);
    return () => window.removeEventListener('mysuregas:moment', listener);
  }, [owner, store]);
  useEffect(() => {
    if (!query.data) return;
    if (!seen.current) { try { seen.current = new Set(JSON.parse(localStorage.getItem(`mysuregas:moments:${owner}`) || '[]')); } catch { seen.current = new Set(); } }
    const records = query.data.slice().sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const candidates: Moment[] = [];
    for (const item of records) {
      if (item.userId !== owner || seen.current.has(item.id)) continue;
      seen.current.add(item.id);
      const moment = notificationMoment(item, role);
      const semantic = moment ? `milestone:${moment.key}` : '';
      if (moment && !seen.current.has(semantic) && (started.current || (!item.isRead && Date.now() - Date.parse(item.createdAt) < 86400000))) {
        seen.current.add(semantic); candidates.push(moment);
      }
    }
    for (const moment of candidates.slice(-3)) store.add(moment);
    started.current = true;
    try { localStorage.setItem(`mysuregas:moments:${owner}`, JSON.stringify([...seen.current].slice(-600))); } catch { /* Session deduplication still works without storage. */ }
  }, [query.data, owner, role, store]);
  const current = list[0];
  return current ? <MomentCard key={current.key} moment={current} role={role} dismiss={store.dismiss} /> : null;
}
export function MomentCard({ moment, role, dismiss, demo = false, onDemoThanks }: { moment: Moment; role: string; dismiss: () => void; demo?: boolean; onDemoThanks?: () => void }) {
  const name = useAuthStore(state => state.user?.firstName);
  const leaving = useRef(false);
  const layer = useRef<HTMLDivElement>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) clearTimeout(timer.current); };
  const leave = useCallback(() => {
    if (leaving.current) return; leaving.current = true;
    const card = layer.current?.querySelector('section');
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { dismiss(); return; }
    const animation = card.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(12px) scale(.96)'}],{duration:150,easing:'ease-in',fill:'forwards'});
    void animation.finished.catch(()=>{}).finally(dismiss);
  },[dismiss]);
  const scene = momentScene(moment), quick = scene === 'quick' || scene === 'cart';
  useEffect(() => {
    const element = layer.current;
    if (element && 'showPopover' in element && !element.matches(':popover-open')) element.showPopover();
    timer.current = setTimeout(leave, Math.max(250,moment.duration-150));
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [leave, moment.duration]);
  const title = moment.title === 'Well done!' && name && !demo ? `Well done, ${name}!` : moment.title;
  return <div ref={layer} popover="manual" className={s.layer} data-scene={scene} data-quick={quick}>
    <div className={s.spotlight} aria-hidden="true" /><MomentParticles scene={scene}/>
    <section className={s.card} data-kind={moment.kind} data-quick={quick} aria-label="MySureGas update" onPointerDown={quick ? undefined : clear} onFocusCapture={clear}>
      <button className={s.close} onClick={leave} aria-label="Dismiss celebration"><X size={18}/></button>
      <MomentArtwork scene={scene}/>
      <div className={s.copy} role="status" aria-live="polite"><small>{demo ? 'ANIMATION PREVIEW · SAMPLE DATA' : moment.kind==='tip' ? 'A LITTLE KINDNESS. A BIG SMILE.' : moment.kind==='reward' ? 'THIS ONE IS YOURS' : moment.kind==='assignment' ? 'YOUR NEXT DOORSTEP' : quick ? 'ALL SET' : 'GOOD ENERGY, SHARED'}</small><h2>{title}</h2><p>{moment.message}</p></div>
      {moment.tipId && (demo ? <div className={s.appreciation}><p><strong>Ada</strong> tipped you for <strong>MSG-1024</strong>.</p><MomentAmount value="1000"/><small>Wallet credit: ₦970 after the 3% platform fee.</small><button className={s.thankButton} onClick={onDemoThanks}>Preview a thank-you</button></div> : <RiderTipAppreciation tipId={moment.tipId} celebration/>)}
      {moment.kind==='reward' && (demo ? <button className={s.thankButton} onClick={leave}>Demo reward · preview only</button> : <Link className={s.thankButton} href="/shop/vouchers" onClick={leave}>Unwrap my reward</Link>)}
      {!quick && (moment.kind==='tip'||moment.kind==='assignment'||moment.kind==='gentle') && !demo && <Link className={s.inboxLink} href={role==='RIDER'?moment.kind==='tip'?'/rider/tips':'/rider':role==='STAFF'?'/staff/orders':'/shop/notifications'} onClick={leave}>{moment.kind==='tip'?'Keep this in My tips':moment.kind==='assignment'?'Open orders':'View details in my inbox'}</Link>}
      {!quick&&<div className={s.timerTrack} aria-hidden="true"><span style={{animationDuration:`${moment.duration}ms`}}/></div>}
    </section>
  </div>;
}
