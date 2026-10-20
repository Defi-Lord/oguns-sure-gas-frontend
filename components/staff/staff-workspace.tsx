'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, Check, Flame, Loader2, Mail, Phone, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { canAccessPortal } from '@/lib/portal-access';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser, MeResponse } from '@/types/auth';

import { StaffEnergyArt } from './staff-brand';
import styles from './staff-design.module.css';

import { StaffStudioShell } from './staff-studio';

const StaffUserContext = createContext<AuthUser | null>(null);

export function useStaffUser() { return useContext(StaffUserContext); }

export function StaffWorkspace({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();
  const session = useQuery({
    queryKey: ['staff', 'session', user?.id],
    queryFn: async () => (await api.get<MeResponse>('/auth/me')).data.data.user,
    enabled: hasHydrated && isAuthenticated && user?.role === 'STAFF',
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) router.replace('/staff/login');
  }, [hasHydrated, isAuthenticated, user, router]);

  const logout = () => {
    clearAuth();
    router.replace('/staff/login');
  };

  if (!hasHydrated || !isAuthenticated || !user) {
    return <StaffLoading />;
  }
  if (user.role !== 'STAFF') {
    return <StaffAccessMessage title="Staff account required" detail="This workspace is for staff accounts. Use your account's portal to continue." action={<><Link href="/admin/login" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Admin sign-in</Link><button onClick={logout} className="px-4 py-3 text-sm font-semibold">Sign out</button></>} />;
  }
  if (session.isError) {
    return <StaffAccessMessage title="Unable to verify your session" detail={getApiErrorMessage(session.error)} action={<><button onClick={() => void session.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white"><RefreshCw className="size-4" /> Retry</button><button onClick={logout} className="px-4 py-3 text-sm font-semibold">Sign out</button></>} />;
  }
  if (session.isPending || !session.data) return <StaffLoading />;
  if (!canAccessPortal(session.data, 'staff') || session.data.id !== user.id) {
    return <StaffAccessMessage title="Staff access unavailable" detail="Your account cannot access this workspace. Contact your branch manager for assistance." action={<button onClick={logout} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Return to sign-in</button>} />;
  }

  return (
    <StaffUserContext.Provider value={session.data}>
      <StaffStudioShell logout={logout}>{children}</StaffStudioShell>
    </StaffUserContext.Provider>
  );
}

function StaffLoading() {
  return <main className={`${styles.surface} ${styles.center}`}><div className={styles.loading} role="status"><span className={styles.brandMark}><Flame size={30} aria-hidden="true" /></span><Loader2 className="mx-auto size-5 motion-safe:animate-spin" aria-hidden="true" /><p>Getting your workspace ready…</p></div></main>;
}

function StaffAccessMessage({ title, detail, action }: { title: string; detail: string; action: ReactNode }) {
  return <main className={`${styles.surface} ${styles.center}`}><section className={`${styles.card} ${styles.state} ${styles.enter}`}><ShieldCheck size={30} aria-hidden="true" /><h1>{title}</h1><p role="alert">{detail}</p><div className={styles.stateActions}>{action}</div></section></main>;
}

export function StaffOverview() {
  const user = useContext(StaffUserContext);
  if (!user) return null;
  return (
    <div>
      <div className={`${styles.pageHeading} ${styles.enter}`}><div><p className={styles.eyebrow}>Your everyday workspace</p><h1>Overview</h1></div><span className={styles.pill}><Check size={13} aria-hidden="true" /> Signed in</span></div>
      <section className={`${styles.hero} ${styles.enter}`} aria-labelledby="welcome-heading">
        <div className={styles.heroCopy}><span className={styles.eyebrow}>Together, we keep things moving</span><h2 id="welcome-heading">Welcome, {user.firstName}.</h2><p>Good service starts with you. You’re signed in and part of the MySureGas team.</p><a href="#staff-account" className={styles.button}>View my account <ArrowDownRight size={16} aria-hidden="true" /></a></div>
        <StaffEnergyArt />
      </section>
      <div className={`${styles.grid} ${styles.enter} ${styles.delay}`}>
        <section id="staff-account" aria-labelledby="account-heading" className={`${styles.card} scroll-mt-6`}>
          <div className={styles.cardHeading}><div><h2 id="account-heading">Your profile</h2><p>The account you’re working with.</p></div><span className={styles.avatar} aria-hidden="true">{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span></div>
          <dl className={styles.details}>
            <div><dt><UserRound size={13} aria-hidden="true" /> Full name</dt><dd>{user.firstName} {user.lastName}</dd></div>
            <div><dt><ShieldCheck size={13} aria-hidden="true" /> Account role</dt><dd>Staff</dd></div>
            <div><dt><Mail size={13} aria-hidden="true" /> Email address</dt><dd>{user.email}</dd></div>
            <div><dt><Phone size={13} aria-hidden="true" /> Phone number</dt><dd>{user.phone || 'Not provided'}</dd></div>
          </dl>
        </section>
        <section className={`${styles.card} ${styles.note}`} aria-labelledby="care-heading">
          <ShieldCheck size={30} strokeWidth={1.4} aria-hidden="true" /><h2 id="care-heading">A little everyday care.</h2><p>Working on a shared device? Keep your password private and sign out when you finish.</p>
          <details><summary>Something needs updating?</summary><p>Contact your branch manager if your account details or staff access need attention.</p></details>
        </section>
      </div>
      <footer className={styles.bottom}><span>MySureGas · Staff workspace</span><span>Good energy starts with good people.</span></footer>
    </div>
  );
}
