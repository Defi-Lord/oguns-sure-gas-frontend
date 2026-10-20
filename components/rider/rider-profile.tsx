'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Bike, CheckCircle2, Mail, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import type { AuthUser, MeResponse } from '@/types/auth';
import { useAuthStore } from '@/stores/auth-store';
import { useRiderUser } from './rider-workspace';
import s from './rider-profile.module.css';

function ProfileForm({user}:{user:AuthUser}){
 const client=useQueryClient();const lock=useRef(false);const [edits,setEdits]=useState<{first?:string;last?:string;phone?:string}>({});const first=edits.first??user.firstName;const last=edits.last??user.lastName;const phone=edits.phone??user.phone??'';const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(lock.current)return;setNotice('');setError('');const firstName=first.trim(),lastName=last.trim(),number=phone.trim()||null;
  if(firstName.length<2||firstName.length>50||lastName.length<2||lastName.length>50){setError('Names must contain 2–50 characters.');return;}
  if(number&&(number.length<7||number.length>20)){setError('Phone number must contain 7–20 characters.');return;}
  const body={...(firstName!==user.firstName?{firstName}:{}),...(lastName!==user.lastName?{lastName}:{}),...(number!==user.phone?{phone:number}:{})};
  if(!Object.keys(body).length){setNotice('Your details are already up to date.');return;}
  const session=useAuthStore.getState();if(session.user?.id!==user.id)return;const version=session.sessionVersion;
  lock.current=true;setBusy(true);
  try{
   const updated=(await api.patch<MeResponse>('/users/me',body)).data.data.user;const current=useAuthStore.getState();
   if(current.user?.id!==user.id||current.sessionVersion!==version)return;
   if(updated.id!==user.id||updated.role!=='RIDER'||updated.status!=='ACTIVE'){setError('Your account changed. Refresh your session to continue.');await client.invalidateQueries({queryKey:['rider','session',user.id]});return;}
   const merged={...current.user,...updated};current.setUser(merged);client.setQueryData(['rider','session',user.id],merged);setNotice('Profile saved successfully.');
   // Keep this form mounted after save so its confirmation remains visible.
   client.setQueryData(['rider','profile',user.id],merged);setEdits({});
   await client.invalidateQueries({queryKey:['rider','profile',user.id]});
  }catch(cause){const current=useAuthStore.getState();if(current.user?.id===user.id&&current.sessionVersion===version)setError(getApiErrorMessage(cause));}
  finally{lock.current=false;setBusy(false);}
 }
 return <form className={s.form} onSubmit={e=>void save(e)}><div className={s.cardHeading}><UserRound size={22}/><div><h2>Your contact details</h2><p>Keep your name and phone number current.</p></div></div><div className={s.names}><label>First name<input value={first} onChange={e=>setEdits(v=>({...v,first:e.target.value}))} minLength={2} maxLength={50} required autoComplete="given-name" disabled={busy}/></label><label>Last name<input value={last} onChange={e=>setEdits(v=>({...v,last:e.target.value}))} minLength={2} maxLength={50} required autoComplete="family-name" disabled={busy}/></label></div><label>Phone number<input value={phone} onChange={e=>setEdits(v=>({...v,phone:e.target.value}))} type="tel" maxLength={20} autoComplete="tel" disabled={busy}/></label><small>Leave the phone field empty to remove your current number.</small><label>Email address<input value={user.email} readOnly aria-readonly="true"/></label><p className={s.hint}>Contact your branch manager for email, branch or vehicle changes.</p>{error&&<p className={s.error} role="alert">{error}</p>}{notice&&<p className={s.notice} role="status">{notice}</p>}<button className={s.primary} disabled={busy}>{busy?'Saving…':'Save profile'}</button></form>;
}
export function RiderProfile(){
 const user=useRiderUser();const profile=useQuery({queryKey:['rider','profile',user?.id],queryFn:async({signal})=>(await api.get<MeResponse>('/users/me',{signal})).data.data.user,enabled:!!user,retry:false,refetchOnWindowFocus:false});
 if(!user)return null;
 return <div className={s.page}><header className={s.heading}><div><span className={s.eyebrow}>YOUR ACCOUNT · YOUR JOURNEY</span><h1>Your rider profile.</h1><p>The person behind every good delivery.</p></div><button className={s.button} disabled={profile.isFetching} onClick={()=>void profile.refetch()}><RefreshCw size={16}/> Refresh details</button></header><section data-rider-reveal className={s.hero}><div className={s.avatar} aria-hidden="true">{user.firstName.slice(0,1)}{user.lastName.slice(0,1)}</div><div><small>MYSUREGAS RIDER</small><h2>{user.firstName} {user.lastName}</h2><p><ShieldCheck size={15}/> Rider · {user.status.toLowerCase()}</p></div><Bike className={s.bike} size={86} aria-hidden="true"/></section><div className={s.grid}><section data-rider-reveal>{profile.isPending?<p role="status">Loading your profile…</p>:profile.isError?<div className={s.form} role="alert"><h2>Profile couldn’t load</h2><p>{getApiErrorMessage(profile.error)}</p><button className={s.button} onClick={()=>void profile.refetch()}>Try again</button></div>:profile.data?.id===user.id&&profile.data.role==='RIDER'?<ProfileForm key={user.id} user={profile.data}/>:<p role="alert">Profile unavailable for this account.</p>}</section><aside className={s.side}><section data-rider-reveal className={s.care}><CheckCircle2 size={30}/><h2>Your account, cared for.</h2><p>Your branch manager handles vehicle details, branch assignment and account access.</p><p>Keep your password private and sign out on shared devices.</p></section><section className={s.shortcuts}><h2>Your everyday tools</h2><Link href="/rider#deliveries"><Bike size={20}/> Assigned deliveries ↗</Link><Link href="/rider/notifications"><Bell size={20}/> Your inbox ↗</Link><div><Mail size={17}/><span>{user.email}</span></div></section></aside></div></div>;
}
