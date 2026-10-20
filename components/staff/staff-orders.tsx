'use client';
import { StaffDispatch, StaffRiderRoster } from './staff-dispatch';
import { CylinderPhotoView } from '@/components/shared/cylinder-photo';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Copy, CreditCard, MapPin, Package, RefreshCw, Search, Sparkles, Truck, X } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import s from './staff-orders.module.css';

type Branch = { id: string; name: string; code: string };
type StaffOrder = {
  id: string; orderNumber: string; status: string; createdAt: string; totalAmount: number; notes: string | null;
  customer: { firstName: string; lastName: string; phone: string | null };
  fulfillmentBranch: Branch;
  deliveryAddress: { addressLine: string; area: string | null; city: string; state: string; phone: string | null };
  items: { id: string; quantity: number; product: { name: string; unit: string } }[];
  payment: { status: string } | null; delivery: { status: string } | null;
};
type List = { branch: Branch; orders: StaffOrder[]; page: number; pageSize: number; total: number };
const statuses = ['PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','FAILED'];
const label = (value: string) => value.toLowerCase().replaceAll('_',' ').replace(/^./, c => c.toUpperCase());
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
const date = (value: string) => new Date(value).toLocaleString('en-NG', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
export function StaffOrders() {
  const userId = useAuthStore(state => state.user?.id);
  const [page, setPage] = useState(1); const [status, setStatus] = useState(''); const [search, setSearch] = useState(''); const [selected, setSelected] = useState<string | null>(null); const [sort, setSort] = useState('newest'); const [copyMessage, setCopyMessage] = useState('');
  const orders = useQuery({ queryKey:['staff','orders',userId,status,page], queryFn: async () => (await api.get<{data:List}>('/orders/staff', { params:{page,...(status ? {status} : {})} })).data.data, refetchInterval:30000 });
  const detail = useQuery({ queryKey:['staff','orders',userId,'detail',selected], queryFn:async () => (await api.get<{data:{order:StaffOrder}}>(`/orders/staff/${selected}`)).data.data.order, enabled:!!selected, staleTime:0, retry:false });
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!selected) return;
    const element = dialog.current; const trigger = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; trigger?.focus(); };
  }, [selected]);
  async function copyReference(reference: string) {
    try { await navigator.clipboard.writeText(reference);setCopyMessage('Order reference copied.'); }
    catch { setCopyMessage('Copy unavailable. Select the order reference to copy it manually.'); }
  }
  function filterStatus(value: string) {setStatus(value);setPage(1);setSearch('');}

  const visible = (orders.data?.orders.filter(order => `${order.orderNumber} ${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(search.trim().toLowerCase())) ?? []).sort((a,b) => sort === 'amount' ? b.totalAmount-a.totalAmount : sort === 'oldest' ? new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const loaded = orders.data?.orders ?? [];
  const active = loaded.filter(order => !['DELIVERED','CANCELLED','FAILED'].includes(order.status)).length;
  const ready = loaded.filter(order => order.status==='READY_FOR_PICKUP').length;
  const delivered = loaded.filter(order => order.status==='DELIVERED').length;
  const lastPage = Math.max(1, Math.ceil((orders.data?.total ?? 0) / (orders.data?.pageSize ?? 20)));
  return <div className={s.page}>
    <header className={s.heading}><div><span className={s.eyebrow}>YOUR BRANCH · YOUR TEAM</span><h1>Orders, at a glance.</h1><p>Keep an eye on the orders your branch is fulfilling.</p></div><button onClick={() => void orders.refetch()} disabled={orders.isFetching} className={s.refresh}><RefreshCw size={17} className={orders.isFetching ? s.spin : ''} /> Refresh</button></header>
    <section data-staff-reveal className={s.banner}><span className={s.package}><Package size={29} /></span><div><h2>{orders.data?.branch.name ?? 'Branch order workspace'}</h2><p>{orders.data ? `${orders.data.branch.code} · ${orders.data.total} ${status ? label(status).toLowerCase()+' ' : ''}orders` : 'Your assigned branch is verified by the server.'}</p></div><span className={s.access}><Sparkles size={13} /> Branch workspace</span></section>
    <StaffRiderRoster/><div className={s.summary} aria-label="Current page summary">{[{name:'In progress',value:active,icon:Clock3,description:'Active orders on this page'},{name:'Ready for pickup',value:ready,icon:Package,description:'Ready orders on this page'},{name:'Delivered',value:delivered,icon:CheckCircle2,description:'Completed orders on this page'}].map(({name,value,icon:Icon,description})=><section key={name} className={s.summaryCard}><span className={s.summaryIcon}><Icon size={22} /></span><div><p>{name}</p><strong>{orders.isSuccess ? value : '—'}</strong><small>{description}</small></div></section>)}</div>
    <div className={s.quickFilters} aria-label="Quick order filters">{[['','All orders'],['CONFIRMED','Confirmed'],['PENDING','Pending'],['PROCESSING','Processing'],['READY_FOR_PICKUP','Ready for pickup'],['OUT_FOR_DELIVERY','On the road'],['DELIVERED','Delivered']].map(([value,name])=><button key={value} aria-pressed={status===value} onClick={()=>filterStatus(value)}>{name}</button>)}</div>
    <section data-staff-reveal className={s.panel} aria-label="Branch orders"><div className={s.toolbar}><label className={s.search}><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search this page…" aria-label="Search orders on this page" /></label><label className={s.filter}>Status<select aria-label="Order status filter" value={status} onChange={e => filterStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label><label className={s.filter}>Sort page<select aria-label="Sort orders on this page" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount">Highest amount</option></select></label></div><div className={s.listHeading}><span>BRANCH ORDER FEED</span><p>{orders.isSuccess ? `${visible.length} shown on this page` : 'Connecting…'} · search and sorting apply to this page</p>{(status || search) && <button onClick={()=>filterStatus('')}>Reset filters</button>}</div>
    {orders.isPending ? <div role="status" className={s.empty}>Loading branch orders…</div> : orders.isError ? <div className={s.empty} role="alert"><Package size={30} /><h2>Orders couldn’t load</h2><p>{getApiErrorMessage(orders.error)}</p><button className={s.refresh} onClick={() => void orders.refetch()}>Try again</button></div> : visible.length === 0 ? <div className={s.empty}><Package size={32} /><h2>{search ? 'No matches on this page' : 'No orders here yet'}</h2><p>{search ? 'Try another name or order number, or browse another page.' : 'New orders for your assigned branch will appear here.'}</p>{search && <button className={s.refresh} onClick={() => setSearch('')}>Clear search</button>}</div> : <div className={s.rows}>{visible.map(order => <button key={order.id} className={s.row} onClick={() => {setCopyMessage('');setSelected(order.id);}} aria-label={`View order ${order.orderNumber}`}><span className={s.orderIcon}>{order.status==='DELIVERED' ? <CheckCircle2 size={20} /> : order.status==='OUT_FOR_DELIVERY' ? <Truck size={20} /> : <Package size={20} />}</span><div className={s.orderMain}><strong>{order.orderNumber}</strong><p>{order.customer.firstName} {order.customer.lastName} · {order.items.length} item{order.items.length === 1 ? '' : 's'}</p><small>{date(order.createdAt)}</small></div><span className={s.status} data-status={order.status}>{label(order.status)}</span><span className={s.amount}>{money(order.totalAmount)}</span><ArrowUpRight size={17} /></button>)}</div>}
    {orders.isSuccess && <footer className={s.pagination}><span>Page {page} of {lastPage} · {orders.data.total} orders</span><div><button aria-label="Previous page" disabled={page===1} onClick={() => {setPage(p=>p-1);setSearch('');}}><ArrowLeft size={17} /></button><button aria-label="Next page" disabled={page>=lastPage} onClick={() => {setPage(p=>p+1);setSearch('');}}><ArrowRight size={17} /></button></div></footer>}</section>
    <p className={s.note}>Orders refresh every 30 seconds. Prepare paid, confirmed orders and assign available riders from your branch.</p>
    <dialog aria-label="Order details" ref={dialog} className={s.dialog} onCancel={() => setSelected(null)} onClick={e => {if(e.target===e.currentTarget)setSelected(null);}}><div className={s.detail}><button className={s.close} aria-label="Close order details" onClick={() => setSelected(null)}><X size={22} /></button>{detail.isPending ? <div role="status" className={s.drawerLoading}><Package size={32} /><p>Loading order details…</p></div> : detail.isError ? <div role="alert"><h2>Order unavailable</h2><p>{getApiErrorMessage(detail.error)}</p><button className={s.refresh} onClick={() => void detail.refetch()}>Try again</button></div> : detail.data && <><div className={s.drawerHero}><span className={s.eyebrow}>YOUR BRANCH · ORDER DETAILS</span><h2>{detail.data.orderNumber}</h2><span className={s.status} data-status={detail.data.status}>{label(detail.data.status)}</span><p className={s.detailDate}>{date(detail.data.createdAt)} · {detail.data.fulfillmentBranch.name}</p><button className={s.copy} onClick={()=>void copyReference(detail.data.orderNumber)}><Copy size={14} /> Copy reference</button>{copyMessage && <p role="status" className={s.copyMessage}>{copyMessage}</p>}</div><section><h3>Customer</h3><p>{detail.data.customer.firstName} {detail.data.customer.lastName}</p>{detail.data.customer.phone && <p>{detail.data.customer.phone}</p>}</section><section><h3><MapPin size={14} /> Delivery address</h3><p>{[detail.data.deliveryAddress.addressLine,detail.data.deliveryAddress.area,detail.data.deliveryAddress.city,detail.data.deliveryAddress.state].filter(Boolean).join(', ')}</p>{detail.data.deliveryAddress.phone && <p>{detail.data.deliveryAddress.phone}</p>}</section><CylinderPhotoView key={detail.data.id} orderId={detail.data.id}/><section><h3>Items to prepare</h3><ul className={s.items}>{detail.data.items.map(item => <li key={item.id}><span>{item.product.name}</span><strong>{item.quantity} {item.product.unit}</strong></li>)}</ul></section><div className={s.total}><span>Order total</span><strong>{money(detail.data.totalAmount)}</strong></div><div className={s.payment}><div><CreditCard size={19} /><span>Payment<strong>{detail.data.payment ? label(detail.data.payment.status) : 'No payment record'}</strong></span></div><div><Truck size={19} /><span>Delivery<strong>{detail.data.delivery ? label(detail.data.delivery.status) : 'Not assigned'}</strong></span></div></div>{detail.data.notes && <section><h3>Customer notes</h3><p>{detail.data.notes}</p></section>}<StaffDispatch key={detail.data.id} orderId={detail.data.id} status={detail.data.status} paid={detail.data.payment?.status==='PAID'} onUpdated={()=>detail.refetch()}/></>}</div></dialog>
  </div>;
}
