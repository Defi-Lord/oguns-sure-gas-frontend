import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/components/auth/login-form';
import { StaffBrand, StaffEnergyArt } from '@/components/staff/staff-brand';
import styles from '@/components/staff/staff-design.module.css';

export default function StaffLoginPage() {
  return (
    <main className={styles.surface}>
      <div className={styles.login}>
        <section className={styles.story} aria-labelledby="staff-welcome">
          <StaffBrand />
          <div className={`${styles.storyCopy} ${styles.enter}`}>
            <p className={styles.eyebrow}>The people behind the energy</p>
            <h1 id="staff-welcome">Good energy.<br /><em>Great teamwork.</em></h1>
            <p>A little care. A lot of impact. Welcome to your MySureGas staff workspace.</p>
          </div>
          <StaffEnergyArt />
          <div className={styles.storyFooter}><span>Made for your branch team.</span><span>MySureGas · Staff portal</span></div>
        </section>
        <section className={styles.loginPanel} aria-labelledby="staff-login-heading">
          <div className={`${styles.formArea} ${styles.enter} ${styles.delay}`}>
            <span className={styles.iconTile}><LockKeyhole size={23} strokeWidth={1.6} aria-hidden="true" /></span>
            <h2 id="staff-login-heading">Welcome back.</h2>
            <p className={styles.subtitle}>Your team. Your workspace.<br />Sign in with your staff account to get started.</p>
            <LoginForm portal="staff" />
            <details className={styles.help}><summary>Need help signing in?</summary><p>Use the email address on your staff invitation. If you have not accepted your invitation or your account is awaiting approval, contact your branch manager.</p></details>
          </div>
          <p className={styles.loginFooter}><ShieldCheck size={14} aria-hidden="true" /> Your account is yours. Keep your password private.</p>
        </section>
      </div>
    </main>
  );
}
