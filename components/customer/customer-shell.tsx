'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Menu, X, ChevronRight, ArrowUpRight, Sparkles, Store, LogOut, UserRound, MapPin, HelpCircle, ArrowRight, ShoppingBag, Package, Bell, Gift, Ticket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import s from './customer.module.css';
import h from './customer-header.module.css';
import { CustomerRewardNotice } from './customer-reward-notice';
import { useShoppingBranch } from './customer-branch';
import { useCustomerCart } from '@/stores/customer-cart-store';

function HeaderBranch({customer}:{customer:boolean}) {
 const {branch}=useShoppingBranch();
 return branch?<Link className={h.branchChip} href={customer?'/shop/profile#my-branch':'/shop#branches'}><MapPin size={14}/><span>{branch.name}</span><small>Change in profile</small></Link>:null;
}
export function CustomerShell({ children }: { children: React.ReactNode }) {
 const drawer = useRef<HTMLDialogElement>(null), closing = useRef(false);
 const [menuOpen, setMenuOpen] = useState(false);
 const pathname = usePathname();
 const [hoveredNav,setHoveredNav]=useState<number|null>(null);
 const activeNav=pathname.startsWith('/shop/orders')?1:pathname.startsWith('/shop/giveaways')||pathname.startsWith('/shop/vouchers')?2:0;
 const bagCount=useCustomerCart(v=>v.hydrated?v.items.length:0);
 useEffect(()=>useAuthStore.subscribe((next,previous)=>{if(previous.user&&(previous.user.id!==next.user?.id||next.user?.role!=='CUSTOMER'||next.user?.status!=='ACTIVE'))useCustomerCart.getState().clearBag();}),[]);
 const { user, hasHydrated, clearAuth } = useAuthStore();
 const customer = hasHydrated && user?.role === 'CUSTOMER' && user.status === 'ACTIVE';
 const unread=useQuery({queryKey:['customer','notifications',user?.id,'count'],queryFn:getUnreadNotificationCount,enabled:!!customer,refetchInterval:30000,retry:false});
 const name = customer ? user.firstName?.trim() || 'Customer' : 'Guest';
 const initials = customer ? `${user.firstName?.[0] || 'C'}${user.lastName?.[0] || ''}`.toUpperCase() : '';
 function open() { if (closing.current) return; drawer.current?.showModal(); setMenuOpen(true); }
 function close() {
  const el = drawer.current; if (!el?.open || closing.current) return;
  closing.current = true;
  const animation = el.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-110%)', opacity: .5 }], { duration: 380, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
  void animation.finished.catch(() => {}).finally(() => { el.close(); animation.cancel(); closing.current = false; setMenuOpen(false); });
 }
 const links = [
  { href: '/shop', title: 'Shop', note: 'Gas, cylinders & everyday essentials', icon: Store },
  { href: '/shop/cart', title: 'Your bag', note: `${bagCount} product${bagCount===1?'':'s'} · Review and checkout`, icon: ShoppingBag },
  { href: '/shop/orders', title: 'Your orders', note: 'Purchases, delivery updates & rider location', icon: Package },
  { href: '/shop/notifications', title: 'Your inbox', note: customer&&unread.isSuccess&&!unread.isError?`${unread.data} unread update${unread.data===1?'':'s'}`:'Orders, delivery alerts & account messages', icon: Bell },
  { href: '/shop/giveaways', title: 'Giveaways', note: 'Live campaigns, task proof & your entry status', icon: Gift },
  { href: '/shop/vouchers', title: 'My vouchers', note: 'Your awarded rewards & redemption codes', icon: Ticket },
  { href: '/shop/support', title: 'Order support', note: 'Questions, concerns & your branch conversations', icon: HelpCircle },
  { href: '/shop/profile', title: 'Your account', note: 'Your profile & saved delivery addresses', icon: UserRound },
  { href: customer ? '/shop/profile#my-branch' : '/shop#branches', title: 'My branch', note: 'Your saved local shopping branch', icon: MapPin },
  { href: '/shop#guide', title: 'How to shop', note: 'A simple guide to getting started', icon: HelpCircle },
  ...(!customer ? [{ href: '/shop/login', title: 'Sign in', note: 'Continue with your customer account', icon: UserRound }, { href: '/shop/register', title: 'Create an account', note: 'Make yourself at home', icon: Sparkles }] : []),
 ];
 if (pathname === '/shop/login' || pathname === '/shop/register') return <div className={s.surface}><main id="customer-content">{children}</main></div>;
 return <div className={s.surface} data-customer-effects="on" data-customer-design="navigation-v3">
  <a className={s.skip} href="#customer-content">Skip to content</a>
  <header className={`${s.topbar} ${h.header}`}>
   <div className={h.identity}><Link href="/shop" className={h.brand} aria-label="MySureGas shop"><span className={h.flame}><Flame size={28} strokeWidth={1.8}/><i/></span>MySureGas</Link><button className={h.menu} aria-label="Open customer menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="customer-drawer" onClick={open}><Menu size={19}/></button></div>
   <nav className={h.navigation} aria-label="Main navigation" style={{'--nav-index':hoveredNav??activeNav} as CSSProperties} onPointerLeave={()=>setHoveredNav(null)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setHoveredNav(null);}}><Link href="/shop" onPointerEnter={()=>setHoveredNav(0)} onFocus={()=>setHoveredNav(0)} aria-current={pathname === '/shop' ? 'page' : undefined}>Shop</Link><Link href="/shop/orders" onPointerEnter={()=>setHoveredNav(1)} onFocus={()=>setHoveredNav(1)} aria-current={pathname === '/shop/orders' ? 'page' : undefined}>Orders</Link><Link href="/shop/giveaways" onPointerEnter={()=>setHoveredNav(2)} onFocus={()=>setHoveredNav(2)} aria-current={pathname === '/shop/giveaways'||pathname === '/shop/vouchers' ? 'page' : undefined}>Rewards<span/></Link></nav>
   <div className={h.actions}><HeaderBranch customer={!!customer}/>{customer&&<Link href="/shop/notifications" className={h.icon} aria-label={unread.isSuccess&&!unread.isError?`Notifications, ${unread.data} unread`:"Notifications"}><Bell size={19}/>{unread.isSuccess&&!unread.isError&&unread.data>0&&<small>{unread.data>99?"99+":unread.data}</small>}</Link>}<Link href="/shop/cart" className={h.icon} aria-label={`Your bag, ${bagCount} products`}><ShoppingBag size={20}/>{bagCount>0&&<small>{bagCount}</small>}</Link><span className={h.divider}/>{customer ? <Link href="/shop/profile" className={h.account} aria-label={`Your customer account, ${name}`}><span className={h.avatar} aria-hidden="true"><span className={h.portrait}><i/><b/></span><small>{initials}</small></span><span className={h.accountName}><small>Your everyday energy</small><strong>{name}</strong></span><ChevronRight size={14}/></Link> : <Link className={h.signin} href="/shop/login"><UserRound size={17}/><span>Sign in</span></Link>}</div>
  </header>
  <dialog id="customer-drawer" ref={drawer} className={s.drawer} aria-label="Customer menu" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); }}>
   <header><div className={s.drawerBrand}><span className={s.brand}><span><Flame size={24}/></span>MySureGas</span><small>Your local shop, made simple.</small></div><button className={s.iconButton} aria-label="Close customer menu" onClick={close}><X size={22}/></button></header>
   <div className={s.drawerWelcome}><span className={s.welcomeOrb} aria-hidden="true">{customer ? initials : <Sparkles size={24}/>}</span><div><small>{customer ? 'YOUR CUSTOMER SPACE' : 'WELCOME TO MYSUREGAS'}</small><strong>{customer ? `Hello, ${name}.` : 'Good things start here.'}</strong><p>{customer ? 'Let’s find what you need today.' : 'Explore your branch. Find your essentials.'}</p></div><span className={s.welcomeOrbit} aria-hidden="true"/></div>
   <h2 className={s.drawerLabel}>EXPLORE</h2>
   <nav aria-label="Customer drawer navigation">{links.map(({href,title,note,icon:Icon}) => <Link key={href} href={href} onClick={close} aria-current={href === pathname ? 'page' : undefined}><span className={s.drawerNavIcon}><Icon size={20}/></span><span className={s.drawerNavCopy}><strong>{title}</strong><small>{note}</small></span><ArrowUpRight size={17}/></Link>)}</nav>
   <div className={s.drawerJourney}><div><Sparkles size={15}/><span>A LITTLE GUIDE</span></div><h3>Your next step is simple.</h3><p>Your branch is remembered on your account. Manage it in your profile.</p><Link href={customer ? "/shop/profile#my-branch" : "/shop#branches"} onClick={close}>My branch<ArrowRight size={16}/></Link><div className={s.journeySteps} aria-hidden="true"><span>01 · Choose</span><i/><span>02 · Explore</span></div></div>
   <div className={s.drawerBottom}>{customer && <button className={s.button} onClick={() => { clearAuth(); close(); }}><LogOut size={17}/>Sign out</button>}<span className={s.drawerSignature}><Flame size={12}/> A brighter everyday.</span></div>
  </dialog>
  <main id="customer-content" className={s.content}>{customer&&pathname!=='/shop/vouchers'&&<CustomerRewardNotice key={user.id} owner={user.id}/>} {children}</main>
  <footer className={s.footer}><Link href="/shop" className={s.brand}><Flame size={20}/>MySureGas</Link><p>Cooking gas, cylinders and oils.</p></footer>
 </div>;
}
