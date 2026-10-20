'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bell, Bike, History, Wallet, LayoutDashboard, LogOut, Menu, Package, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { getUnreadNotificationCount } from '@/lib/api/notifications';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { canAccessPortal } from '@/lib/portal-access';
import type { AuthUser, MeResponse } from '@/types/auth';
import { RiderBrand } from '@/components/rider/rider-brand';
import s from './rider.module.css';
const RiderContext=createContext<AuthUser|null>(null);
export function useRiderUser(){return useContext(RiderContext);}
export function RiderWorkspace({children}:{children:ReactNode}){
 const router=useRouter();const pathname=usePathname();const {user,isAuthenticated,hasHydrated,clearAuth}=useAuthStore();const drawer=useRef<HTMLDialogElement>(null);const [effects,setEffects]=useState(true);const closing=useRef(false);const content=useRef<HTMLElement>(null);
 const session=useQuery({queryKey:['rider','session',user?.id],queryFn:async()=>(await api.get<MeResponse>('/auth/me')).data.data.user,enabled:hasHydrated&&isAuthenticated&&user?.role==='RIDER',retry:false,staleTime:0,refetchOnMount:'always'});
 const unread=useQuery({queryKey:['rider','notifications',user?.id,'count'],queryFn:getUnreadNotificationCount,enabled:!!session.data&&session.data.id===user?.id&&canAccessPortal(session.data,'rider'),refetchInterval:30000,retry:false});
 useEffect(()=>{if(hasHydrated&&(!user||!isAuthenticated))router.replace('/rider/login');},[hasHydrated,user,isAuthenticated,router]);
 function closeMenu(){
   const element=drawer.current;if(!element?.open||closing.current)return;
   if(!effects){element.close();return;}
   closing.current=true;element.setAttribute('data-closing','true');
   const animation=element.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX(-105%)',opacity:0}],{duration:380,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'});
   void animation.finished.catch(()=>{}).finally(()=>{element.close();animation.cancel();element.removeAttribute('data-closing');closing.current=false;});
 }
 useEffect(()=>{
   if(!effects||!session.data||!content.current||!('IntersectionObserver' in window))return;
   const root=content.current;const seen=new WeakSet<Element>();
   const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.removeAttribute('data-motion-pending');entry.target.setAttribute('data-motion-enter','true');}else{entry.target.removeAttribute('data-motion-enter');if(entry.boundingClientRect.top>=innerHeight)entry.target.setAttribute('data-motion-pending','true');}}),{threshold:.06});
   const watch=()=>root.querySelectorAll('[data-rider-reveal]').forEach(element=>{if(seen.has(element))return;seen.add(element);if(element.getBoundingClientRect().top>=innerHeight)element.setAttribute('data-motion-pending','true');observer.observe(element);});
   const mutation=new MutationObserver(watch);watch();mutation.observe(root,{childList:true,subtree:true});
   const clear=()=>{observer.disconnect();mutation.disconnect();root.querySelectorAll('[data-rider-reveal]').forEach(element=>{element.removeAttribute('data-motion-pending');element.removeAttribute('data-motion-enter');});};
   return clear;
 },[effects,session.data]);
 function logout(){clearAuth();router.replace('/rider/login');}
 if(!hasHydrated||!isAuthenticated||!user)return <main className={s.gate}><Bike size={44}/><p role="status">Getting your rider workspace ready…</p></main>;
 if(user.role!=='RIDER')return <main className={s.gate}><ShieldCheck size={36}/><h1>Rider account required</h1><p>This workspace is for rider accounts.</p><button className={s.button} onClick={logout}>Return to sign-in</button></main>;
 if(session.isError)return <main className={s.gate}><ShieldCheck size={36}/><h1>Unable to verify your session</h1><p role="alert">{getApiErrorMessage(session.error)}</p><button className={s.button} onClick={()=>void session.refetch()}>Retry</button><button className={s.button} onClick={logout}>Sign out</button></main>;
 if(session.isPending||!session.data)return <main className={s.gate}><Bike size={44}/><p role="status">Checking your rider account…</p></main>;
 if(!canAccessPortal(session.data,'rider')||session.data.id!==user.id)return <main className={s.gate}><ShieldCheck size={36}/><h1>Rider access unavailable</h1><p>Contact your branch manager for assistance.</p><button className={s.button} onClick={logout}>Return to sign-in</button></main>;
 return <RiderContext.Provider value={session.data}><div className={s.surface} data-rider-effects={effects?'on':'off'}><a className={s.skip} href="#rider-content">Skip to content</a><header className={s.topbar}><div><button aria-label="Open rider menu" aria-haspopup="dialog" onClick={()=>drawer.current?.showModal()} className={s.menu}><Menu size={21}/></button><Link href="/rider"><RiderBrand/></Link><span className={s.breadcrumb}>Rider workspace</span></div><div><button className={s.effects} aria-label={effects?'Pause visual effects':'Enable visual effects'} aria-pressed={effects} onClick={()=>setEffects(v=>!v)}><Sparkles size={17}/><span>{effects?'Effects on':'Effects paused'}</span></button><Link href="/rider/notifications" className={s.menu} aria-label={unread.isSuccess?`Notifications, ${unread.data} unread`:'Notifications'}><Bell size={19}/>{unread.isSuccess&&unread.data>0&&<span>{unread.data>99?'99+':unread.data}</span>}</Link><button aria-label="Sign out" className={s.menu} onClick={logout}><LogOut size={19}/></button></div></header>
 <dialog ref={drawer} className={s.menuDrawer} aria-label="Rider menu" onCancel={e=>{e.preventDefault();closeMenu();}} onClick={e=>{if(e.target===e.currentTarget)closeMenu();}}><div className={s.drawerHeading}><RiderBrand/><button aria-label="Close rider menu" onClick={closeMenu}><X size={21}/></button></div><span className={s.eyebrow}>YOUR RIDER WORKSPACE</span><nav>{[{href:'/rider',name:'Overview',icon:LayoutDashboard},{href:'/rider#deliveries',name:'Assigned deliveries',icon:Package},{href:'/rider/history',name:'Delivery history',icon:History},{href:'/rider/wallet',name:'My wallet',icon:Wallet},{href:'/rider/tips',name:'My tips',icon:Sparkles},{href:'/rider/notifications',name:'Notifications',icon:Bell},{href:'/rider/profile',name:'My account',icon:UserRound}].map(({href,name,icon:Icon})=><Link key={href} href={href} aria-current={pathname===href?'page':undefined} onClick={closeMenu}><Icon size={20}/>{name}</Link>)}</nav><div className={s.menuIdentity}><strong>{session.data.firstName} {session.data.lastName}</strong><span>Rider · {session.data.status.toLowerCase()}</span></div></dialog><main ref={content} id="rider-content" className={s.content}>{children}</main><footer className={s.footer}>MySureGas · Good energy, on the move.</footer></div></RiderContext.Provider>;
}
