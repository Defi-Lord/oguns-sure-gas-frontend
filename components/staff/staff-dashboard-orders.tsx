'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Bell, CheckCircle2, MapPin, Package, RefreshCw } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import s from './staff-dashboard-orders.module.css';
type OrderPreview={id:string;orderNumber:string;status:string;createdAt:string;totalAmount:number;customer:{firstName:string;lastName:string};items:{id:string}[]};
type BranchOrders={branch:{id:string;name:string;code:string};orders:OrderPreview[];total:number;page:number;pageSize:number};
const money=(value:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'}).format(value);
const label=(value:string)=>value.toLowerCase().replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
export function StaffDashboardOrders({unread,unreadFailed}:{unread:number|undefined;unreadFailed:boolean}) {
  const id=useAuthStore(state=>state.user?.id);
  const orders=useQuery({queryKey:['staff','orders',id,'',1],queryFn:async()=>(await api.get<{data:BranchOrders}>('/orders/staff',{params:{page:1}})).data.data,refetchInterval:30000,retry:false});
  const ready=useQuery({queryKey:['staff','orders',id,'READY_FOR_PICKUP',1],queryFn:async()=>(await api.get<{data:BranchOrders}>('/orders/staff',{params:{page:1,status:'READY_FOR_PICKUP'}})).data.data,refetchInterval:30000,retry:false});
  return <section className={s.workspace} aria-label="Live branch overview">
    <div className={s.branch}><span><MapPin size={17}/>{orders.isSuccess?`${orders.data.branch.name} · ${orders.data.branch.code}`:'Your branch workspace'}</span><small>Updates every 30 seconds</small></div>
    <div className={s.tiles}><Link href="/staff/orders" className={s.tile} data-staff-reveal><span className={s.icon}><Package size={23}/></span><div><p>Branch orders</p><strong>{orders.isSuccess?orders.data.total:orders.isError?'Unavailable':'…'}</strong><small>All statuses · all time</small></div><ArrowUpRight size={17}/></Link><Link href="/staff/orders" className={s.tile} data-staff-reveal><span className={s.icon}><CheckCircle2 size={23}/></span><div><p>Ready for pickup</p><strong>{ready.isSuccess?ready.data.total:ready.isError?'Unavailable':'…'}</strong><small>Current ready orders across your branch</small></div><ArrowUpRight size={17}/></Link><Link href="/staff/notifications" className={s.tile} data-staff-reveal><span className={s.icon}><Bell size={23}/></span><div><p>Unread notifications</p><strong>{unreadFailed?'Unavailable':unread??'…'}</strong><small>Messages waiting for you</small></div><ArrowUpRight size={17}/></Link></div>
    {ready.isError&&<p role="alert" className={s.error}>Ready-for-pickup count couldn’t load. <button onClick={()=>void ready.refetch()}>Retry count</button></p>}
    <section className={s.panel} data-staff-reveal><header><div><h2>Latest branch orders</h2><p>A quick look at your branch’s five newest orders.</p></div><div className={s.headerActions}><button aria-label="Refresh branch overview" disabled={orders.isFetching||ready.isFetching} onClick={()=>{void orders.refetch();void ready.refetch();}}><RefreshCw size={16} className={orders.isFetching?s.spin:''}/></button><Link href="/staff/orders">View orders <ArrowUpRight size={15}/></Link></div></header>
    {orders.isPending?<div className={s.empty} role="status"><Package size={30}/><p>Loading branch orders…</p></div>:orders.isError?<div className={s.empty} role="alert"><Package size={32}/><h3>Branch orders couldn’t load</h3><p>{getApiErrorMessage(orders.error)}</p><button className={s.retry} onClick={()=>void orders.refetch()}>Try again</button></div>:orders.data.orders.length===0?<div className={s.empty}><Package size={32}/><h3>A fresh start.</h3><p>New orders for your assigned branch will appear here.</p><Link href="/staff/orders">Open branch orders <ArrowUpRight size={15}/></Link></div>:<ul className={s.orders}>{orders.data.orders.slice(0,5).map(order=><li key={order.id}><span className={s.orderIcon}><Package size={18}/></span><div className={s.orderName}><strong>{order.orderNumber}</strong><p>{order.customer.firstName} {order.customer.lastName} · {order.items.length} item{order.items.length===1?'':'s'}</p><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('en-NG',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time></div><span className={s.status} data-status={order.status}>{label(order.status)}</span><strong className={s.amount}>{money(order.totalAmount)}</strong></li>)}</ul>}
    </section><p className={s.note}>Your branch manager handles order updates and rider assignments. Open branch orders for full details.</p>
  </section>;
}
