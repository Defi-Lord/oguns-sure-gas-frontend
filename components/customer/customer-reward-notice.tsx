'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Gift } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { VoucherListResponse } from '@/types/campaign';
import s from './customer-reward-notice.module.css';
export function CustomerRewardNotice({owner}:{owner:string}){
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const query=useQuery({queryKey:['customer','vouchers',owner],queryFn:async({signal})=>(await api.get<VoucherListResponse>('/vouchers/me',{signal})).data.data.vouchers,staleTime:0,refetchOnMount:'always',refetchOnWindowFocus:'always',refetchInterval:30000,retry:false});
 const available=(query.data??[]).filter(v=>v.status==='ACTIVE'&&!v.redeemedAt&&(!v.expiresAt||Date.parse(v.expiresAt)>now)).sort((a,b)=>(a.expiresAt?Date.parse(a.expiresAt):Infinity)-(b.expiresAt?Date.parse(b.expiresAt):Infinity));
 const reward=available[0];if(!reward||query.isError)return null;
 const soon=Boolean(reward.expiresAt&&Date.parse(reward.expiresAt)-now<=86400000);
 return <aside className={s.notice} data-urgent={soon} aria-label="Your unused giveaway rewards"><span className={s.icon}><Gift size={24}/></span><div><small>{soon?'DON’T MISS YOUR REWARD':'A LITTLE WIN IS WAITING'}</small><strong>{available.length>1?`${available.length} rewards ready to redeem`:reward.rewardName}</strong><p>{reward.expiresAt?`Redeem ${soon?'before it expires':'by'} ${new Date(reward.expiresAt).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'})} · Lagos time.`:'Show your private voucher to MySureGas staff to claim your reward.'}</p></div><Link href={`/shop/vouchers#voucher-${encodeURIComponent(reward.id)}`}>View my reward <ArrowUpRight size={16}/></Link></aside>;
}
