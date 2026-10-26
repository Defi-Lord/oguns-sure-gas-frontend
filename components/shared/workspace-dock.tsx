"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Gift, History, House, Menu, Package, Wallet } from 'lucide-react';
import styles from './workspace-dock.module.css';

type Props = { portal: 'staff' | 'rider'; openMenu: () => void; unread?: number };

export function WorkspaceDock({ portal, openMenu, unread }: Props) {
  const pathname = usePathname();
  const items = portal === 'staff'
    ? [{ href: '/staff', label: 'Home', icon: House }, { href: '/staff/orders', label: 'Orders', icon: Package }, { href: '/staff/redeem', label: 'Redeem', icon: Gift }, { href: '/staff/products', label: 'Products', icon: Package }]
    : [{ href: '/rider', label: 'Deliveries', icon: House }, { href: '/rider/history', label: 'History', icon: History }, { href: '/rider/wallet', label: 'Wallet', icon: Wallet }, { href: '/rider/notifications', label: 'Inbox', icon: Bell }];
  const extraPage = !items.some(item => item.href === pathname);
  return <nav className={styles.dock} aria-label={`${portal === 'staff' ? 'Staff' : 'Rider'} primary navigation`}>
    {items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
      <span className={styles.icon}><Icon size={21} strokeWidth={1.8} aria-hidden="true" />{href.endsWith('/notifications') && !!unread && unread > 0 && <b aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</b>}</span><span>{label}</span>
    </Link>)}
    <button type="button" onClick={openMenu} aria-label="Open all workspace options" aria-haspopup="dialog" data-active={extraPage || undefined}><span className={styles.icon}><Menu size={21} aria-hidden="true" /></span><span>More</span></button>
  </nav>;
}
