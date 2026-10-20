'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Bell, Check, CheckCheck, CreditCard, Gift, Package, RefreshCw, Search, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api/client';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '@/lib/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import c from './customer.module.css';
import type { NotificationType } from '@/types/notification';
import s from './customer-inbox.module.css';
import { customerNotificationDestination as destination } from './customer-notification-destination';
const types: NotificationType[] = ['ORDER','DELIVERY','PAYMENT','SYSTEM','PROMOTION'];
const icons = { ORDER:Package, DELIVERY:Truck, PAYMENT:CreditCard, SYSTEM:ShieldCheck, PROMOTION:Gift };
const label = (value:string) => value.charAt(0)+value.slice(1).toLowerCase();
const timestamp = (value:string) => {const date=new Date(value);return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString('en-NG',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});};
export function CustomerInbox() {
 const {user,hasHydrated}=useAuthStore();
 if(!hasHydrated)return <div className={s.empty} role="status">Preparing your inbox…</div>;
 if(user?.role!=='CUSTOMER'||user.status!=='ACTIVE')return <section className={s.guest}><div className={s.guestOrb}><Bell size={42}/></div><span className={s.eyebrow}>YOUR CUSTOMER SPACE</span><h1>Your updates belong here.</h1><p>Sign in with your customer account to see order updates, delivery alerts and messages from MySureGas.</p><Link className={c.primary} href="/shop/login?next=notifications">Sign in to your inbox <ArrowUpRight size={18}/></Link><Link className={s.back} href="/shop">Back to the shop</Link></section>;
 return <Inbox key={user.id} id={user.id}/>;
}
function Inbox({id}:{id:string}) {
  const client=useQueryClient();const lock=useRef(false);
  const [unread,setUnread]=useState(false);const [type,setType]=useState<NotificationType|''>('');const [search,setSearch]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState<unknown>(null);const [notice,setNotice]=useState('');
  const count=useQuery({queryKey:['customer','notifications',id,'count'],queryFn:getUnreadNotificationCount,enabled:!!id,refetchInterval:30000,retry:false});
  const inbox=useQuery({queryKey:['customer','notifications',id,'list',unread,type],queryFn:()=>getNotifications({limit:100,...(unread?{isRead:false}:{}),...(type?{type}:{})}),enabled:!!id,refetchInterval:30000,retry:false});
  const visible=(inbox.data??[]).filter(item=>`${item.title} ${item.message}`.toLowerCase().includes(search.trim().toLowerCase()));
  async function mark(notificationId?:string) {
    if(lock.current||!id)return;lock.current=true;setBusy(true);setError(null);setNotice('');
    try {if(notificationId)await markNotificationRead(notificationId);else await markAllNotificationsRead();setNotice(notificationId?'Notification marked as read.':'All notifications marked as read.');await client.invalidateQueries({queryKey:['customer','notifications',id]});}
    catch(cause){setError(cause);}finally{lock.current=false;setBusy(false);}
  }
  function reset(){setSearch('');setType('');setUnread(false);}
  return <div className={s.page}>
    <header className={s.heading}><div><span className={s.eyebrow}>YOUR CUSTOMER SPACE · IN THE LOOP</span><h1>Your inbox.</h1><p>A little closer to every update.</p></div><button className={s.button} disabled={inbox.isFetching||count.isFetching} onClick={()=>void client.invalidateQueries({queryKey:['customer','notifications',id]})}><RefreshCw size={17} className={inbox.isFetching?s.spin:''} /> Refresh</button></header>
    <section className={s.hero}><div className={s.heroIcon}><Bell size={32}/></div><div><span className={s.heroLabel}>GOOD ENERGY · GOOD NEWS</span><h2>{count.isSuccess&&!count.isError?(count.data===0?'You’re all caught up.':`${count.data} unread update${count.data===1?'':'s'}.`):count.isError?'Unread count unavailable.':'Your updates, together.'}</h2><p>Orders, deliveries and a little good news. All together.</p></div><Sparkles className={s.sparkle} size={60} aria-hidden="true"/><span className={s.orbit} aria-hidden="true"/></section>
    <section className={s.panel} aria-label="Customer inbox"><div className={s.toolbar}><div className={s.tabs}><button aria-pressed={!unread} onClick={()=>setUnread(false)}>All messages</button><button aria-pressed={unread} onClick={()=>setUnread(true)}>Unread {count.isSuccess&&!count.isError&&<span>{count.data}</span>}</button></div><button className={s.button} disabled={busy||!count.isSuccess||count.isError||!count.data} onClick={()=>void mark()}><CheckCheck size={17}/> {busy?'Updating…':'Mark all read'}</button></div>
    <div className={s.filters}><label className={s.search}><Search size={17}/><input aria-label="Search loaded notifications" placeholder="Search loaded messages…" value={search} onChange={event=>setSearch(event.target.value)}/></label><select aria-label="Notification type filter" value={type} onChange={event=>setType(event.target.value as NotificationType|'')}><option value="">All categories</option>{types.map(value=><option key={value} value={value}>{label(value)}</option>)}</select>{(search||type||unread)&&<button className={s.reset} onClick={reset}>Reset filters</button>}</div>
    {notice&&<p className={s.notice} role="status"><Check size={17}/>{notice}</p>}{error!=null&&<p className={s.error} role="alert">{getApiErrorMessage(error)}<span>Try the action again when your connection is available.</span></p>}
    {inbox.isPending?<div className={s.loading} role="status"><span>Loading your inbox…</span>{[1,2,3].map(value=><div key={value} className={s.skeleton} aria-hidden="true"/>)}</div>:inbox.isError?<div className={s.empty} role="alert"><Bell size={38}/><h2>Inbox couldn’t load</h2><p>{getApiErrorMessage(inbox.error)}</p><button className={s.button} onClick={()=>void inbox.refetch()}>Try again</button></div>:visible.length===0?<div className={s.empty}><CheckCheck size={42}/><h2>{search?'No matching messages':unread?'You’re all caught up':'No notifications here yet'}</h2><p>{search?'Try another word or reset your filters.':type?'New messages for this category will appear here.':'New messages for your account will appear here.'}</p>{(search||type)&&<button className={s.button} onClick={reset}>Reset filters</button>}</div>:<div className={s.messages}>{visible.map(item=>{const Icon=icons[item.type]??Bell;const target=destination(item);return <article key={item.id} className={s.message} data-unread={!item.isRead}><div className={s.messageIcon}><Icon size={23}/></div><div className={s.messageBody}><div className={s.meta}><span className={s.category}>{label(item.type)}</span>{!item.isRead&&<span className={s.unread}>Unread</span>}<time dateTime={item.createdAt}>{timestamp(item.createdAt)}</time></div><h2>{item.title}</h2><p>{item.message}</p><div className={s.actions}>{!item.isRead&&<button className={s.read} disabled={busy} onClick={()=>void mark(item.id)}><Check size={15}/> Mark as read</button>}{target&&<Link href={target.href}>{target.label} <ArrowUpRight size={15}/></Link>}{item.isRead&&<span className={s.readLabel}><CheckCheck size={14}/> Read</span>}</div></div></article>;})}</div>}
    </section><p className={s.footer}>Showing up to 100 recent messages for the selected filters. Search applies to loaded messages. Updates refresh every 30 seconds while open.</p>
  </div>;
}
