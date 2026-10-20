'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api/client';
import styles from './staff-design.module.css';

export function AcceptStaffInvite() {
  const params = useSearchParams();
  const [token, setToken] = useState(() => params.get('token')?.trim() ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    const invitationToken = token.trim();
    if (invitationToken.length < 32 || invitationToken.length > 256) {
      setError('Enter the complete invitation token provided by your manager.'); return;
    }
    if (password.length < 8 || password.length > 72) {
      setError('Use a password between 8 and 72 characters.'); return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.'); return;
    }
    submitting.current = true;
    setPending(true);
    try {
      // Public endpoint: do not send or replace a logged-in administrator's session.
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/staff/accept-invite`, { token: invitationToken, password }, { timeout: 20_000 });
      setAccepted(true);
      setPassword(''); setConfirmPassword(''); setToken('');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (accepted) return <section className={styles.formArea} role="status"><CheckCircle2 size={42} className="mb-6 text-emerald-700" aria-hidden="true" /><h2>Invitation accepted.</h2><p className={styles.subtitle}>Your password is set. Your account is now <strong>Pending Approval</strong>.</p><p className={styles.subtitle}>Ask your branch manager or Super Admin to approve your account. You can sign in after approval.</p><Link href="/staff/login" className={`${styles.button} mt-7`}>Go to staff sign-in</Link></section>;

  return <section className={styles.formArea} aria-labelledby="accept-heading">
    <span className={styles.iconTile}><KeyRound size={24} aria-hidden="true" /></span>
    <h2 id="accept-heading">Join your team.</h2>
    <p className={styles.subtitle}>Set your staff password. Your manager will approve your account after you accept.</p>
    <form onSubmit={event => void submit(event)} className="space-y-5">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <div className="space-y-2"><label htmlFor="invite-token">Invitation token</label><input id="invite-token" value={token} onChange={event => setToken(event.target.value)} disabled={pending} autoComplete="off" spellCheck={false} required maxLength={256} className="w-full border px-3 font-mono text-xs" /><p className="text-xs leading-5 text-slate-500">Already have a token? Paste it here. Expired or used tokens cannot be accepted.</p></div>
      <div className="space-y-2"><label htmlFor="staff-new-password">Create password</label><div className="relative"><input id="staff-new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} disabled={pending} minLength={8} maxLength={72} required className="w-full border pl-3 pr-12" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="absolute right-0 top-0 grid h-full w-12 place-items-center">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p className="text-xs text-slate-500">Use 8–72 characters.</p></div>
      <div className="space-y-2"><label htmlFor="staff-confirm-password">Confirm password</label><input id="staff-confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} disabled={pending} required className="w-full border px-3" /></div>
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 font-semibold disabled:opacity-60">{pending && <Loader2 size={17} className="motion-safe:animate-spin" aria-hidden="true" />}{pending ? 'Accepting invitation…' : 'Accept invitation'}</button>
    </form>
    <details className={styles.help}><summary>Need help with your invitation?</summary><p>Ask your manager for the original staff invitation token or link. If the token has expired or was lost, your manager will need to arrange a new invitation. Do not share your password.</p></details>
  </section>;
}
