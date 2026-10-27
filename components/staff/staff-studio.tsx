'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Bell, ChevronRight, Gift, LayoutDashboard, LogOut, Menu, Package, X, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { StaffBrand } from './staff-brand';
import s from './staff-studio.module.css';
import { StaffHome, StaffHomeDock } from './staff-home';

const links = [{ href: '/staff/products', label: 'Products & stock', icon: Package }, { href: '/staff', label: 'Overview', icon: LayoutDashboard }, { href: '/staff/orders', label: 'Branch orders', icon: Package }, { href: '/staff/support', label: 'Order support', icon: MessageCircle }, { href: '/staff/redeem', label: 'Redeem voucher', icon: Gift }, { href: '/staff/notifications', label: 'Notifications', icon: Bell }, { href: '/staff/profile', label: 'My profile', icon: UserRound }];
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
  return <div className={s.studio} data-effects={effects ? 'on' : 'off'} data-home={path === '/staff' ? 'true' : undefined}>
    <a href="#staff-content" className={s.skip}>Skip to content</a>

    <dialog ref={drawer} className={s.drawer} aria-label="Staff menu" onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}><div className={s.drawerHeading}><StaffBrand /><button aria-label="Close menu" onClick={() => drawer.current?.close()}><X size={22} /></button></div><p className={s.drawerCaption}>YOUR EVERYDAY WORKSPACE</p><nav aria-label="Staff menu navigation" className={s.drawerNav}>{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} onClick={() => drawer.current?.close()}><Icon size={20} /><span>{label}</span>{href === '/staff/notifications' && count.isSuccess && count.data > 0 && <b>{count.data}</b>}</Link>)}</nav><div className={s.drawerFooter}><span className={s.avatar}>{user?.firstName?.slice(0,1)}{user?.lastName?.slice(0,1)}</span><strong>{user?.firstName} {user?.lastName}</strong><button aria-label="Sign out from menu" onClick={() => {drawer.current?.close();logout();}}><LogOut size={19} /></button></div></dialog>
    <div className={s.body}><header className={s.topbar}><div className={s.topStart}><button className={s.menuButton} aria-label="Open staff menu" aria-haspopup="dialog" onClick={() => drawer.current?.showModal()}><Menu size={20} /></button><Link href="/staff" className={s.headerBrand}><StaffBrand /></Link><span className={s.breadcrumb}>Workspace <ChevronRight size={13} /> <strong>{links.find(item => item.href === path)?.label ?? 'Staff'}</strong></span></div><div className={s.topActions}><button className={s.effectsButton} aria-label={effects ? 'Pause visual effects' : 'Enable visual effects'} aria-pressed={effects} onClick={() => setEffects(value => !value)} title={effects ? 'Pause visual effects' : 'Enable visual effects'}><Sparkles size={17} /><span>{effects ? 'Effects on' : 'Effects paused'}</span></button><button onClick={logout} className={s.mobileLogout} aria-label="Sign out"><LogOut size={18} /></button><span className={s.secure}><ShieldCheck size={15} /> Staff access</span><Link href="/staff/notifications" aria-label={count.isSuccess ? `Notifications, ${count.data} unread` : 'Notifications'} className={s.bell}><Bell size={19} />{count.isSuccess && count.data > 0 && <span />}</Link></div></header><main ref={content} id="staff-content" className={s.content}>{children}</main></div><StaffHomeDock />
  </div>;
}
export function StaffStudioDashboard() {
  return <StaffHome />;
}
