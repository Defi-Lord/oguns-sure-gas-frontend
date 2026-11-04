'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Flame, LoaderCircle, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import s from './customer-account-email.module.css';

type EmailStatus = { email:string;verified:boolean;enabled:boolean;required:boolean };
function useEmailStatus() {
  const user=useAuthStore(v=>v.user),session=useAuthStore(v=>v.sessionVersion),hydrated=useAuthStore(v=>v.hasHydrated);
  const customer=hydrated&&user?.role==='CUSTOMER'&&user.status==='ACTIVE';
  const query=useQuery({queryKey:['customer-account-email',user?.id,session],enabled:Boolean(customer),retry:false,refetchOnWindowFocus:true,
    queryFn:async()=>(await api.get<{data:EmailStatus}>('/auth/email-status')).data.data,staleTime:0});
  return {...query,customer,user};
}
export function CustomerEmailNotice() {
  const {data,customer}=useEmailStatus();
  if(!customer||!data?.enabled||data.verified)return null;
  return <aside className={s.notice} aria-label="Email verification"><MailCheck size={20}/><span><strong>One quick step: verify your email.</strong><small>{data.required?'Verify before your next checkout or giveaway entry.':'Keep your account ready and receive important updates.'}</small></span><Link href="/shop/account-email">Verify <ArrowRight size={15}/></Link></aside>;
}
export function CustomerAccountEmail({mode}:{mode:'status'|'verify'|'forgot'|'reset'}) {
  const {data,customer,isPending,isError,refetch}=useEmailStatus();
  const client=useQueryClient();
  const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[complete,setComplete]=useState(false),[cooldown,setCooldown]=useState(false);
  const lock=useRef(false);
  useEffect(()=>{
    if(mode!=='verify'&&mode!=='reset')return;
    const timer=window.setTimeout(()=>{
      const params=new URLSearchParams(window.location.hash.slice(1));
      const value=params.get('token');
      if(value){
        if(mode==='reset')sessionStorage.removeItem('mysuregas-password-reset-success');
        setToken(value);window.history.replaceState(null,'',window.location.pathname+window.location.search);
      }else if(mode==='reset'){
        const finished=Number(sessionStorage.getItem('mysuregas-password-reset-success'));
        if(finished>0&&Date.now()-finished<300_000){setComplete(true);setMessage('Password changed. Please sign in again.');}
      }
    },0);
    return ()=>window.clearTimeout(timer);
  },[mode]);
  const verified=mode==='status'&&data?.verified;
  const title=complete?(mode==='reset'?'A fresh start.':'You’re verified.') : verified?'You’re all set.':mode==='forgot'?'Forgot your password?':mode==='reset'?'Choose a new password.':mode==='verify'?'Let’s make it official.':'Your inbox. Your account.';
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(lock.current)return;
    const form=new FormData(event.currentTarget),password=String(form.get('password')??''),confirmPassword=String(form.get('confirmPassword')??'');
    setError('');setMessage('');
    if(mode==='reset'&&(password!==confirmPassword||new TextEncoder().encode(password).length>72)){setError('Use matching passwords with at least 8 characters and no more than 72 UTF-8 bytes.');return;}
    const owner=useAuthStore.getState().user?.id,session=useAuthStore.getState().sessionVersion;
    lock.current=true;setBusy(true);
    try{
      const endpoint=mode==='status'?'resend-verification':mode==='verify'?'verify-email':mode==='forgot'?'forgot-password':'reset-password';
      const payload=mode==='status'?{}:mode==='verify'?{token}:mode==='forgot'?{email:String(form.get('email')??'').trim().toLowerCase()}:{token,password,confirmPassword};
      const response=await api.post<{message:string}>(`/auth/${endpoint}`,payload);
      if(mode==='status'&&(useAuthStore.getState().user?.id!==owner||useAuthStore.getState().sessionVersion!==session))return;
      setMessage(response.data.message);
      if(mode==='verify'||mode==='reset'){
        setComplete(true);setToken('');
        if(mode==='reset'){
          sessionStorage.setItem('mysuregas-password-reset-success',String(Date.now()));
          if(useAuthStore.getState().user?.role==='CUSTOMER')useAuthStore.getState().clearAuth();
        }
        await client.invalidateQueries({queryKey:['customer-account-email']});
      }else setCooldown(true);
    }catch(failure){setError(getApiErrorMessage(failure));}finally{lock.current=false;setBusy(false);}
  }
  useEffect(()=>{if(!cooldown)return;const timer=window.setTimeout(()=>setCooldown(false),120_000);return()=>window.clearTimeout(timer);},[cooldown]);
  return <section className={s.stage}><div className={s.glow} aria-hidden="true"/><article className={s.card}>
    <Link className={s.brand} href="/shop"><Flame size={22}/>MySureGas</Link>
    <div className={`${s.icon} ${complete||verified?s.success:''}`}>{complete||verified?<CheckCircle2/>:mode==='forgot'||mode==='reset'?<LockKeyhole/>:<MailCheck/>}</div>
    <span className={s.eyebrow}>YOUR ACCOUNT, LOOKED AFTER</span><h1>{title}</h1>
    {complete?<><p>{message}</p><Link className={s.primary} href={mode==='reset'?'/shop/login':'/shop/welcome'}>{mode==='reset'?'Sign in with your new password':'Continue to MySureGas'}<ArrowRight size={18}/></Link></>:verified?<><p>Your email address is verified. You’re ready for your next order.</p><p className={s.address}>{data?.email}</p><Link className={s.primary} href="/shop">Back to the shop<ArrowRight size={18}/></Link></>:<>
      <p>{mode==='forgot'?'Enter your customer account email. We’ll send a secure link so you can choose a new password.':mode==='reset'?'A new password keeps your account yours. You’ll sign in again after saving it.':mode==='verify'?'Tap below to confirm this email belongs to you. Opening this page alone does not verify your address.':'Check your inbox for a verification link. It expires in 24 hours. Your existing orders remain available while you verify.'}</p>
      {mode==='status'&&!customer?<Link className={s.primary} href="/shop/login">Sign in to your customer account<ArrowRight size={18}/></Link>:mode==='status'&&isPending?<p role="status"><LoaderCircle className={s.spin}/>Checking your account…</p>:mode==='status'&&isError?<><p role="alert">We couldn’t check your email status.</p><button className={s.secondary} onClick={()=>void refetch()}>Try again</button></>:mode==='status'&&!data?.enabled?<p role="status">Account email is being prepared. Please try again shortly.</p>:<form onSubmit={event=>void submit(event)}>
        {mode==='status'&&<p className={s.address}>{data?.email}</p>}
        {mode==='forgot'&&<label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" disabled={busy||cooldown}/></label>}
        {mode==='reset'&&token&&<><label>New password<input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" disabled={busy}/></label><label>Confirm new password<input name="confirmPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" disabled={busy}/></label></>}
        {(mode==='verify'||mode==='reset')&&!token?<p role="alert">This page needs the complete link from your email. If it was already used or expired, request a new one.</p>:<button className={s.primary} disabled={busy||cooldown}>{busy?<LoaderCircle className={s.spin} size={18}/>:<ArrowRight size={18}/>} {busy?'Please wait…':cooldown?'Email requested — check your inbox':mode==='status'?'Resend verification email':mode==='forgot'?'Send reset link':mode==='verify'?'Verify my email':'Save new password'}</button>}
      </form>}
      {error&&<p className={s.error} role="alert">{error}</p>}{message&&<p className={s.feedback} role="status">{message}</p>}
      {(mode==='status'||mode==='forgot')&&<small className={s.hint}>Check Spam or Promotions too. You can request another email after two minutes.</small>}
      {mode==='reset'&&<Link className={s.textLink} href="/shop/forgot-password">Request a new reset link</Link>}
      {mode==='verify'&&<Link className={s.textLink} href="/shop/account-email">Request a new verification email</Link>}
    </>}
    <footer><ShieldCheck size={16}/> Secure links. No passwords sent by email.</footer><Link className={s.textLink} href={mode==='forgot'||mode==='reset'?'/shop/login':'/shop/profile'}>{mode==='forgot'||mode==='reset'?'Back to customer sign-in':'Back to your profile'}</Link>
  </article></section>;
}
