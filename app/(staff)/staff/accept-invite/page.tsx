import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { StaffBrand, StaffEnergyArt } from '@/components/staff/staff-brand';
import { AcceptStaffInvite } from '@/components/staff/accept-staff-invite';
import styles from '@/components/staff/staff-design.module.css';

export const metadata: Metadata = { title: 'Accept staff invitation | MySureGas', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default function AcceptStaffInvitationPage() {
  return <main className={styles.surface}><div className={styles.login}>
    <section className={styles.story}><StaffBrand /><div className={`${styles.storyCopy} ${styles.enter}`}><p className={styles.eyebrow}>Your next chapter starts here</p><h1>A great team.<br /><em>One more reason.</em></h1><p>Welcome to MySureGas. Accept your invitation and get ready to be part of your branch team.</p></div><StaffEnergyArt /><div className={styles.storyFooter}><span>Your account. Your password.</span><span>MySureGas · Staff portal</span></div></section>
    <div className={styles.loginPanel}><Link href="/staff/login" className={styles.topLink}>Staff sign-in <ArrowUpRight size={15} aria-hidden="true" /></Link><Suspense fallback={<p className={styles.formArea} role="status">Loading invitation…</p>}><AcceptStaffInvite /></Suspense><p className={styles.loginFooter}><ShieldCheck size={14} aria-hidden="true" /> Management approval is required before sign-in.</p></div>
  </div></main>;
}
