'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, ArrowUpRight, Bell, Check, ChevronRight, Gift, LayoutDashboard, LogOut, Menu, Package, X, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount } from '@/lib/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { StaffBrand, StaffEnergyArt } from './staff-brand';
import s from './staff-studio.module.css';
import { StaffDashboardOrders } from './staff-dashboard-orders';

const links = [{ href: '/staff', label: 'Overview', icon: LayoutDashboard }, { href: '/staff/orders', label: 'Branch orders', icon: Package }, { href: '/staff/support', label: 'Order support', icon: MessageCircle }, { href: '/staff/redeem', label: 'Redeem voucher', icon: Gift }, { href: '/staff/notifications', label: 'Notifications', icon: Bell }, { href: '/staff/profile', label: 'My profile', icon: UserRound }];
function useCount() { const id = useAuthStore(state => state.user?.id); return useQuery({ queryKey: ['staff','notifications',id,'count'], queryFn: getUnreadNotificationCount, refetchInterval: 30000 }); }
export function StaffStudioShell({ children, logout }: { children: ReactNode; logout: () => void }) {
  const path = usePathname(); const user = useAuthStore(state => state.user); const count = useCount();
  const drawer = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLElement>(null);
  const [effects, setEffects] = useState(true);
  useEffect(() => {
    if (!effects || !content.current || !('IntersectionObserver' in window)) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const targets = Array.from(content.current.querySelectorAll<HTMLElement>('[data-staff-reveal]'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.removeAttribute('data-reveal-pending');
        entry.target.setAttribute('data-reveal-enter', 'true');
      } else {
        entry.target.removeAttribute('data-reveal-enter');
        if (entry.boundingClientRect.top >= window.innerHeight) entry.target.setAttribute('data-reveal-pending', 'true');
      }
    }), { threshold: 0.08 });
    targets.forEach(target => { if (target.getBoundingClientRect().top >= window.innerHeight) target.setAttribute('data-reveal-pending', 'true'); observer.observe(target); });
    const showAll = () => { observer.disconnect(); targets.forEach(target => target.removeAttribute('data-reveal-pending')); };
    media.addEventListener('change', showAll);
    return () => { showAll(); targets.forEach(target => target.removeAttribute('data-reveal-enter')); media.removeEventListener('change', showAll); };
  }, [path, effects]);
  return <div className={s.studio} data-effects={effects ? 'on' : 'off'}>
    <a href="#staff-content" className={s.skip}>Skip to content</a>

    <dialog ref={drawer} className={s.drawer} aria-label="Staff menu" onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}><div className={s.drawerHeading}><StaffBrand /><button aria-label="Close menu" onClick={() => drawer.current?.close()}><X size={22} /></button></div><p className={s.drawerCaption}>YOUR EVERYDAY WORKSPACE</p><nav aria-label="Staff menu navigation" className={s.drawerNav}>{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} onClick={() => drawer.current?.close()}><Icon size={20} /><span>{label}</span>{href === '/staff/notifications' && count.isSuccess && count.data > 0 && <b>{count.data}</b>}</Link>)}</nav><div className={s.drawerFooter}><span className={s.avatar}>{user?.firstName?.slice(0,1)}{user?.lastName?.slice(0,1)}</span><strong>{user?.firstName} {user?.lastName}</strong><button aria-label="Sign out from menu" onClick={() => {drawer.current?.close();logout();}}><LogOut size={19} /></button></div></dialog>
    <div className={s.body}><header className={s.topbar}><div className={s.topStart}><button className={s.menuButton} aria-label="Open staff menu" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}><Menu size={20} /></button><Link href="/staff" className={s.headerBrand}><StaffBrand /></Link><span className={s.breadcrumb}>Workspace <ChevronRight size={13} /> <strong>{links.find(item => item.href === path)?.label ?? 'Staff'}</strong></span></div><div className={s.topActions}><button className={s.effectsButton} aria-label={effects ? 'Pause visual effects' : 'Enable visual effects'} aria-pressed={effects} onClick={() => setEffects(value => !value)} title={effects ? 'Pause visual effects' : 'Enable visual effects'}><Sparkles size={17} /><span>{effects ? 'Effects on' : 'Effects paused'}</span></button><button onClick={logout} className={s.mobileLogout} aria-label="Sign out"><LogOut size={18} /></button><span className={s.secure}><ShieldCheck size={15} /> Staff access</span><Link href="/staff/notifications" aria-label={count.isSuccess ? `Notifications, ${count.data} unread` : 'Notifications'} className={s.bell}><Bell size={19} />{count.isSuccess && count.data > 0 && <span />}</Link></div></header><main ref={content} id="staff-content" className={s.content}>{children}</main></div>
  </div>;
}
export function StaffStudioDashboard() {
  const user = useAuthStore(state => state.user); const count = useCount();
  const recent = useQuery({ queryKey: ['staff','notifications',user?.id,'preview'], queryFn: () => getNotifications({limit:5}), refetchInterval:30000 });
  return <div className={s.dashboard}>
    <div className={s.titleRow}><div><p className={s.overline}>LET’S MAKE TODAY COUNT</p><h1>Hello, {user?.firstName} <span className={s.sun} aria-hidden="true">✳</span></h1><p>Everything you need for a little more flow in your day.</p></div><Link href="/staff/profile" className={s.profileLink}>My profile <ArrowUpRight size={16} /></Link></div>
    <section data-staff-reveal className={s.hero}><div className={s.heroCopy}><span className={s.heroTag}><Sparkles size={13} /> THE GOOD ENERGY TEAM</span><h2>Small moments.<br /><em>Big smiles.</em></h2><p>Turn a customer’s reward into a great experience. Your next redemption starts here.</p><Link href="/staff/redeem" className={s.heroButton}>Redeem a voucher <ArrowUpRight size={18} /></Link></div><div className={s.heroArt}><StaffEnergyArt /><span className={s.artLabel}><Check size={15} /> A little reward. A brighter day.</span></div><div className={s.heroRing} aria-hidden="true" /></section>
    <StaffDashboardOrders unread={count.isSuccess ? count.data : undefined} unreadFailed={count.isError} />
    <div className={s.lowerGrid}><section data-staff-reveal className={s.panel}><div className={s.panelHeading}><div><h2>Your latest updates</h2><p>A quick look at your inbox.</p></div><Link href="/staff/notifications">View all <ArrowUpRight size={15} /></Link></div>{recent.isPending ? <div role="status" className={s.empty}>Loading your updates…</div> : recent.isError ? <div className={s.empty}><Bell size={26} /><h3>Updates couldn’t load</h3><button onClick={() => void recent.refetch()} className={s.retry}>Try again</button></div> : recent.data?.length === 0 ? <div className={s.empty}><span className={s.emptyIcon}><Bell size={25} /></span><h3>A quiet moment.</h3><p>Your next notification will appear here.</p></div> : <ul className={s.updates}>{recent.data?.map(item => <li key={item.id}><Link href="/staff/notifications"><span className={`${s.updateIcon} ${item.isRead ? '' : s.unread}`}><Bell size={16} /></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('en-NG')}</small></div><ChevronRight size={16} /></Link></li>)}</ul>}</section>
    <section data-staff-reveal className={`${s.panel} ${s.guide}`}><span className={s.guideTag}>A QUICK REMINDER</span><h2>Make every<br />reward count.</h2><ol>{[['Enter the voucher','Use the customer’s code or QR token.'],['Confirm the redemption','Review the entry before submitting.'],['Check the receipt','Wait for success before issuing the reward.']].map(([title,detail],index) => <li key={title}><span>{index+1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol><Link href="/staff/redeem">Let’s get started <ArrowUpRight size={17} /></Link></section></div>
    <footer className={s.footer}><span>MySureGas · Built around your team.</span><span>Good energy, every day.</span></footer>
  </div>;
}
