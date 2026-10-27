'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Bell, Bike, Check, ChevronRight, Clock3, House, MapPin, Package, Plus, QrCode, RefreshCw, Settings2, UserRound, X } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { StaffDispatch } from './staff-dispatch';
import { CylinderPhotoView } from '@/components/shared/cylinder-photo';
import s from './staff-home.module.css';

type Order = {
  id: string; orderNumber: string; status: string; createdAt: string; totalAmount: number;
  customer: { firstName: string; lastName: string };
  items: { id: string; quantity: number; product: { name: string; unit: string } }[];
  payment: { status: string } | null;
};
type Feed = { branch: { id: string; name: string; code: string }; orders: Order[]; total: number; pageSize: number };
type Rider = { id: string; vehicleType: string | null; vehicleNumber: string | null; user: { firstName: string; lastName: string } };
const tabs = [{ status: 'CONFIRMED', label: 'New', icon: Package }, { status: 'PROCESSING', label: 'Preparing', icon: Settings2 }, { status: 'READY_FOR_PICKUP', label: 'Ready', icon: Check }];
const money = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
const initials = (first: string, last: string) => `${first.slice(0, 1)}${last.slice(0, 1)}`;
function shortDate(date: string) {
  return new Date(date).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function StaffHomeDock() {
  const path = usePathname();
  const items = [{ href: '/staff', label: 'Home', icon: House }, { href: '/staff/orders', label: 'Orders', icon: Package }, { href: '/staff/redeem', label: 'Scan', icon: QrCode }, { href: '/staff/products', label: 'Products', icon: Package }, { href: '/staff/profile', label: 'Profile', icon: UserRound }];
  return <nav className={s.dock} aria-label="Staff primary navigation">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={label === 'Scan' ? s.scanTab : undefined}><span><Icon size={22} aria-hidden="true" /></span>{label}</Link>)}</nav>;
}

export function StaffHome() {
  const user = useAuthStore(state => state.user);
  const version = useAuthStore(state => state.sessionVersion);
  const hydrated = useAuthStore(state => state.hasHydrated);
  const enabled = hydrated && user?.role === 'STAFF' && user.status === 'ACTIVE';
  const [tab, setTab] = useState(0), [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const feeds = useQueries({ queries: tabs.map(t => ({
    queryKey: ['staff', 'orders', user?.id, t.status, 1, 'home', version],
    queryFn: async ({ signal }: { signal: AbortSignal }) => (await api.get<{ data: Feed }>('/orders/staff', { signal, params: { page: 1, status: t.status } })).data.data,
    enabled, retry: false, refetchInterval: 30000,
  })) });
  const riders = useQuery({ queryKey: ['staff', 'available-riders', user?.id, 'home', version], queryFn: async ({ signal }) => (await api.get<{ data: { riders: Rider[] } }>('/orders/staff/available-riders', { signal })).data.data.riders, enabled, retry: false, refetchInterval: 15000 });
  const stock = useQuery({ queryKey: ['product-submissions', user?.id, version, 'options'], queryFn: async ({ signal }) => (await api.get<{ data: { lowStock: { id: string }[] } }>('/product-submissions/options', { signal })).data.data, enabled, retry: false, refetchInterval: 30000 });
  const pending = useQuery({ queryKey: ['product-submissions', user?.id, version, 'home-pending'], queryFn: async ({ signal }) => (await api.get<{ data: { total: number } }>('/product-submissions', { signal, params: { page: 1, status: 'PENDING' } })).data.data, enabled, retry: false, refetchInterval: 30000 });
  const detail = useQuery({ queryKey: ['staff', 'orders', user?.id, 'detail', selected, version], queryFn: async ({ signal }) => (await api.get<{ data: { order: Order } }>(`/orders/staff/${selected}`, { signal })).data.data.order, enabled: enabled && !!selected, retry: false, staleTime: 0 });
  useEffect(() => {
    if (!selected) return;
    const element = dialog.current, trigger = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; trigger?.focus(); };
  }, [selected]);
  const feed = feeds[tab];
  const branch = feeds.find(f => f.isSuccess)?.data?.branch;
  async function refresh() { await Promise.allSettled([...feeds.map(f => f.refetch()), riders.refetch(), stock.refetch(), pending.refetch()]); }
  const fetching = feeds.some(f => f.isFetching) || riders.isFetching;
  if (!enabled) return <div className={s.empty} role="status">Preparing your staff workspace…</div>;
  return <div className={s.home}>
    <header className={s.greeting}><Link href="/staff/profile" className={s.avatar} aria-label="Your staff profile">{initials(user.firstName, user.lastName)}</Link><div><p>YOUR BRANCH WORKSPACE</p><h1>Hello, {user.firstName}</h1><span><MapPin size={12} />{branch?.name ?? 'Loading assigned branch…'}</span></div><button className={s.refresh} disabled={fetching} aria-label="Refresh staff dashboard" onClick={() => void refresh()}><RefreshCw size={18} className={fetching ? s.spin : undefined} /></button></header>
    <div className={s.ribbon}><span><i aria-hidden="true" />Branch workspace</span><a href="#staff-riders"><Bike size={16}/>{riders.isSuccess ? `${riders.data.length} available` : riders.isError ? 'Riders unavailable' : 'Checking riders…'}<ChevronRight size={13}/></a></div>
    <section aria-labelledby="shift-heading"><h2 id="shift-heading" className={s.sectionTitle}>Your shift, at a glance</h2><div className={s.metrics}>{tabs.map(({ label, icon: Icon }, i) => <button key={label} onClick={() => setTab(i)} aria-label={`Show ${label.toLowerCase()} orders`} className={s.metric} data-selected={tab === i}><span className={s.metricIcon}><Icon size={21}/>{i === 0 && !!feeds[i].data?.total && <i/>}</span><span><small>{label}</small><strong>{feeds[i].isSuccess ? String(feeds[i].data.total).padStart(2, '0') : '—'}</strong></span></button>)}</div></section>
    <div className={s.quick}><Link href="/staff/redeem" className={s.scan}><QrCode size={23}/><span>Scan voucher</span><ChevronRight size={18}/></Link><Link href="/staff/products"><Plus size={22}/><span>Add product</span><ChevronRight size={18}/></Link></div>
    <div className={s.columns}><section className={s.queue} aria-labelledby="queue-heading"><div className={s.sectionHeader}><h2 id="queue-heading">Order queue</h2><Link href="/staff/orders">View all <ChevronRight size={15}/></Link></div><div className={s.tabs} aria-label="Order queue filters" style={{ '--tab': tab } as CSSProperties}><span className={s.slider} aria-hidden="true"/>{tabs.map((t, i) => <button key={t.status} aria-pressed={tab === i} onClick={() => setTab(i)}>{t.label}<b>{feeds[i].isSuccess ? feeds[i].data.total : '—'}</b></button>)}</div>
      {feed.isPending ? <div className={s.empty} role="status"><span className={s.loading}/><p>Loading your branch orders…</p></div> : feed.isError ? <div role="alert" className={s.empty}><Package size={25}/><h3>Orders couldn’t load</h3><p>{getApiErrorMessage(feed.error)}</p><button onClick={() => void feed.refetch()}>Try again</button></div> : !feed.data?.orders.length ? <div className={s.empty}><Package size={28}/><h3>{tab === 0 ? 'All caught up.' : tab === 1 ? 'Nothing preparing yet.' : 'No orders ready yet.'}</h3><p>{tab === 0 ? 'New confirmed orders will appear here.' : 'Your team’s next step will appear here.'}</p></div> : <div className={s.orderList} key={tab}>{feed.data.orders.slice(0, 3).map(order => <article className={s.order} key={order.id}><div className={s.productArt} aria-hidden="true"><CylinderArt/></div><div className={s.orderCopy}><div className={s.orderTitle}><h3>{order.orderNumber}</h3><span className={s.paid} data-paid={order.payment?.status === 'PAID'}>{order.payment?.status === 'PAID' ? 'Paid' : 'Check payment'}</span></div><p>{order.customer.firstName} {order.customer.lastName.slice(0, 1)}.</p><small className={s.itemLine}>{order.items.map(item => `${item.quantity} ${item.product.unit} ${item.product.name}`).join(' · ') || 'View order items'}</small><time dateTime={order.createdAt}><Clock3 size={12}/>{shortDate(order.createdAt)}</time></div><button className={s.orderAction} onClick={() => setSelected(order.id)}>{tab === 0 ? 'Start preparing' : tab === 1 ? 'Mark ready' : 'Assign rider'}<ChevronRight size={15}/></button></article>)}</div>}
      {feed.isSuccess && feed.data.total > 3 && <Link className={s.more} href="/staff/orders">Open all branch orders <ArrowRight size={15}/></Link>}
      <p className={s.feedNote}>New means confirmed. Payment is checked before preparation. Updates every 30s.</p>
    </section>
    <aside><section id="staff-riders" className={s.riderSection} aria-labelledby="rider-heading"><div className={s.sectionHeader}><h2 id="rider-heading">Available riders</h2><Link href="/staff/orders">See all <ChevronRight size={15}/></Link></div><div className={s.riders}>{riders.isPending ? <p className={s.inlineState} role="status">Checking availability…</p> : riders.isError ? <div role="alert" className={s.inlineState}><p>Rider availability couldn’t load.</p><button onClick={() => void riders.refetch()}>Retry</button></div> : !riders.data.length ? <p className={s.inlineState}>No riders available right now. Refreshes every 15s.</p> : riders.data.slice(0, 3).map(r => <Link key={r.id} href="/staff/orders" className={s.rider}><span className={s.riderAvatar}>{initials(r.user.firstName, r.user.lastName)}</span><div><strong>{r.user.firstName} {r.user.lastName.slice(0, 1)}.</strong><small><i/>Available</small></div><Bike size={23}/><ChevronRight size={16}/></Link>)}</div><small className={s.rosterNote}>Online with no active delivery. Assign from a ready order.</small></section>
    <section className={s.alerts} aria-label="Stock and product updates"><Link href="/staff/products" className={s.stockAlert}><AlertTriangle size={18}/><span>{stock.isSuccess ? stock.data.lowStock.length ? `${stock.data.lowStock.length} item${stock.data.lowStock.length === 1 ? '' : 's'} running low` : 'Stock levels looking good' : stock.isError ? 'Stock check unavailable' : 'Checking stock levels…'}</span><ChevronRight size={17}/></Link><Link href="/staff/products"><Package size={18}/><span>{pending.isSuccess ? `${pending.data.total} product${pending.data.total === 1 ? '' : 's'} awaiting approval` : pending.isError ? 'Approval count unavailable' : 'Checking product approvals…'}</span><ChevronRight size={17}/></Link></section>
    <Link href="/staff/notifications" className={s.inbox}><Bell size={18}/><span>Your branch updates</span><ChevronRight size={17}/></Link></aside></div>
    <dialog ref={dialog} className={s.dialog} aria-label="Prepare and dispatch order" onCancel={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}><div className={s.dialogBody}><header><span>BRANCH ORDER</span><button aria-label="Close order" onClick={() => setSelected(null)}><X size={21}/></button></header>{detail.isPending ? <p role="status">Loading order details…</p> : detail.isError ? <div role="alert"><p>{getApiErrorMessage(detail.error)}</p><button onClick={() => void detail.refetch()}>Retry order</button></div> : detail.data && <><h2>{detail.data.orderNumber}</h2><p>{detail.data.customer.firstName} {detail.data.customer.lastName}</p><ul className={s.detailItems}>{detail.data.items.map(item => <li key={item.id}><span>{item.product.name}</span><strong>{item.quantity} {item.product.unit}</strong></li>)}</ul><div className={s.total}><span>Order total</span><strong>{money(detail.data.totalAmount)}</strong></div><CylinderPhotoView key={detail.data.id} orderId={detail.data.id}/><StaffDispatch key={detail.data.id} orderId={detail.data.id} status={detail.data.status} paid={detail.data.payment?.status === 'PAID'} onUpdated={async () => { await Promise.allSettled([detail.refetch(), ...feeds.map(f => f.refetch()), riders.refetch()]); }}/></>}</div></dialog>
  </div>;
}
function CylinderArt() {
  const id = useId();
  return <svg viewBox="0 0 70 94" fill="none"><defs><linearGradient id={id} x1="12" x2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#00533d"/><stop offset=".4" stopColor="#16896a"/><stop offset="1" stopColor="#003d2d"/></linearGradient></defs><ellipse cx="35" cy="88" rx="25" ry="4" fill="#004e3318"/><path d="M20 24V9Q35 4 50 9V24M25 10V22M45 10V22" stroke="#126d53" strokeWidth="5"/><path d="M31 12H39V24H31Z" fill="#c1a15e"/><path d="M13 38Q13 24 27 23H43Q57 24 57 38V76Q57 85 48 85H22Q13 85 13 76Z" fill={`url(#${id})`}/><path d="M16 59H54M20 84V89H50V84" stroke="#00503c" strokeWidth="3"/><path d="M35 37C36 44 44 46 40 53C37 58 28 55 29 49C30 44 35 43 35 37Z" fill="#fff8e6"/><path d="M23 64H47M27 68H43" stroke="#f5ffe3" strokeWidth="2" strokeLinecap="round" opacity=".8"/></svg>;
}
