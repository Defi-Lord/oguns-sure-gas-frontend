'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Gift, RefreshCw, Sparkles, Ticket, X } from 'lucide-react';
import { getCustomerCampaigns } from './customer-campaign-data';
import { useAuthStore } from '@/stores/auth-store';
import { useCustomerClock } from '@/stores/customer-cart-store';
import type { Campaign } from '@/types/campaign';
import s from './customer-campaign-announcement.module.css';

function httpsUrl(value:string|null){try{const url=new URL(value??'');return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}}
function action(campaign:Campaign){
 if(campaign.type==='GIVEAWAY')return {href:`/shop/giveaways#campaign-${encodeURIComponent(campaign.id)}`,external:false,label:'View giveaway & tasks'};
 const value=campaign.popupCtaUrl?.trim();
 if(value){try{const base='https://mysuregas.invalid',url=new URL(value,base);if(url.origin===base&&(url.pathname==='/shop'||url.pathname.startsWith('/shop/')))return {href:url.pathname+url.search+url.hash,external:false,label:campaign.popupCtaText||'Explore this campaign'};const external=httpsUrl(value);if(external)return {href:external,external:true,label:campaign.popupCtaText||'Open campaign link'};}catch{}}
 return {href:'/shop#catalogue',external:false,label:'Browse the shop'};
}
function CampaignLink({campaign,onClick}:{campaign:Campaign;onClick?:()=>void}){const target=action(campaign);return target.external?<a href={target.href} target="_blank" rel="noopener noreferrer" className={s.primary} onClick={onClick}>{target.label}<ArrowUpRight size={16}/></a>:<Link href={target.href} className={s.primary} onClick={onClick}>{target.label}<ArrowRight size={16}/></Link>;}
function Art({image,title}:{image:string|null;title:string}){const [failed,setFailed]=useState(false);const safe=httpsUrl(image);return <div className={s.art} aria-hidden={!safe||failed}>{safe&&!failed?<Image src={safe} alt={title} width={420} height={300} unoptimized referrerPolicy="no-referrer" onError={()=>setFailed(true)} className={s.image}/>:<><span className={s.ring}/><span className={s.gift}><Gift size={58} strokeWidth={1.3}/></span><Sparkles className={s.sparkle} size={23}/></>}</div>;}
function Spotlight({campaign,owner,version,claimAutomatic}:{campaign:Campaign;owner:string;version:number;claimAutomatic:()=>boolean}){
 const dialog=useRef<HTMLDialogElement>(null),presentedHere=useRef(false),dismissed=useRef(false);
 const key=`mysuregas-campaign-popup:${owner}:${campaign.id}`;
 const title=campaign.popupTitle||campaign.name,message=campaign.popupMessage||campaign.description||'Explore this MySureGas campaign for full details.';
 function markSeen(){try{sessionStorage.setItem(key,'shown');}catch{/* The visit ref still prevents repeated automatic popups. */}}
 function show(){const element=dialog.current;if(!element||element.open||typeof element.showModal!=='function')return;const current=useAuthStore.getState();if(current.user?.id!==owner||current.sessionVersion!==version||current.user.role!=='CUSTOMER'||current.user.status!=='ACTIVE')return;element.showModal();markSeen();}
 function close(){dismissed.current=true;dialog.current?.close();}
 useEffect(()=>{
  if(!campaign.popupEnabled||dismissed.current)return;
  const current=useAuthStore.getState();if(current.user?.id!==owner||current.sessionVersion!==version||current.user.role!=='CUSTOMER'||current.user.status!=='ACTIVE')return;
  if(!presentedHere.current){try{if(sessionStorage.getItem(key)==='shown')return;}catch{}if(!claimAutomatic())return;presentedHere.current=true;}
  const element=dialog.current;if(!element||typeof element.showModal!=='function')return;if(!element.open)element.showModal();try{sessionStorage.setItem(key,'shown');}catch{}
  return()=>element.close();
 },[campaign.id,campaign.popupEnabled,owner,version,key,claimAutomatic]);
 return <section className={s.banner} aria-label="Live MySureGas campaign"><span className={s.sheen} aria-hidden="true"/><div className={s.bannerCopy}><span className={s.eyebrow}><span className={s.signal}/>{campaign.type==='GIVEAWAY'?'LIVE GIVEAWAY':'LIVE CAMPAIGN'}</span><h2>{title}</h2><p>{message}</p>{campaign.rewardName&&<span className={s.reward}><Gift size={15}/>{campaign.rewardName}</span>}<div className={s.actions}><CampaignLink campaign={campaign}/>{campaign.popupEnabled&&<button type="button" className={s.secondary} onClick={show}>View announcement <Sparkles size={15}/></button>}<Link href="/shop/vouchers" className={s.textLink}>My vouchers <Ticket size={15}/></Link></div></div><Art key={campaign.popupImageUrl??'gift'} image={campaign.popupImageUrl} title={campaign.name}/>
  <dialog ref={dialog} className={s.dialog} aria-labelledby={`announcement-title-${campaign.id}`} onCancel={()=>{dismissed.current=true;}} onClick={event=>{if(event.target===event.currentTarget)close();}}><header><span className={s.eyebrow}>A LITTLE EXTRA GOOD ENERGY</span><button type="button" aria-label="Close campaign announcement" onClick={close} autoFocus><X size={20}/></button></header><div className={s.modalArt}><Art key={campaign.popupImageUrl??'gift'} image={campaign.popupImageUrl} title={campaign.name}/></div><div className={s.modalCopy}><span className={s.badge}>{campaign.type==='GIVEAWAY'?'MYSUREGAS GIVEAWAY':'MYSUREGAS CAMPAIGN'}</span><h2 id={`announcement-title-${campaign.id}`}>{title}</h2><p>{message}</p>{campaign.rewardName&&<span className={s.reward}><Gift size={15}/>{campaign.rewardName}</span>}{campaign.type==='GIVEAWAY'&&<small>Read the campaign rules. Entries are reviewed before rewards are awarded.</small>}<div className={s.modalActions}><CampaignLink campaign={campaign} onClick={close}/><button type="button" className={s.secondary} onClick={close}>Continue shopping</button></div></div></dialog>
 </section>;
}
function CustomerCampaigns({owner,version}:{owner:string;version:number}){
 const now=useCustomerClock(),automaticShown=useRef(false);
 const claimAutomatic=useCallback(()=>{if(automaticShown.current)return false;automaticShown.current=true;return true;},[]);
 const campaigns=useQuery({queryKey:['customer','giveaways',owner],queryFn:({signal})=>getCustomerCampaigns(signal),retry:false,staleTime:0,refetchOnMount:'always',refetchInterval:30000,refetchOnWindowFocus:true});
 const available=(campaigns.data??[]).filter(c=>c.status==='ACTIVE'&&(!c.startsAt||Date.parse(c.startsAt)<=now)&&(!c.endsAt||Date.parse(c.endsAt)>now));
 const featured=available.find(c=>c.type==='GIVEAWAY'&&c.popupEnabled)??available.find(c=>c.popupEnabled)??available.find(c=>c.type==='GIVEAWAY')??available[0];
 if(campaigns.isPending)return <div className={s.loading} role="status">Checking live MySureGas campaigns…</div>;
 if(campaigns.isError)return <div className={s.failure}><p>Campaign announcements couldn’t load. You can still browse the shop.</p><button type="button" className={s.secondary} onClick={()=>void campaigns.refetch()} disabled={campaigns.isFetching}><RefreshCw size={15}/> Retry campaigns</button></div>;
 return featured?<Spotlight key={`${owner}:${featured.id}`} campaign={featured} owner={owner} version={version} claimAutomatic={claimAutomatic}/>:<RewardsInvite signedIn/>;
}
function RewardsInvite({signedIn=false}:{signedIn?:boolean}){return <section className={s.invite} aria-label="Explore MySureGas rewards"><span className={s.inviteIcon}><Gift size={25}/></span><div><span className={s.eyebrow}>MORE GOOD ENERGY</span><h2>{signedIn?'Watch for the next little win.':'Discover MySureGas rewards.'}</h2><p>{signedIn?'No live campaign right now. Your awarded vouchers are still available.':'Explore giveaways and sign in to track your entries and awarded rewards.'}</p></div><Link href={signedIn?'/shop/vouchers':'/shop/giveaways'} className={s.secondary}>{signedIn?'My vouchers':'Explore giveaways'}<ArrowRight size={16}/></Link></section>;}
export function CustomerCampaignAnnouncement(){const {user,hasHydrated,sessionVersion}=useAuthStore();if(!hasHydrated)return null;if(user?.role!=='CUSTOMER'||user.status!=='ACTIVE')return <RewardsInvite/>;return <CustomerCampaigns key={`${user.id}:${sessionVersion}`} owner={user.id} version={sessionVersion}/>;}
