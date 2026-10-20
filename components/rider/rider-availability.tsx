'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bike, Loader2, Moon, Radio, RefreshCw } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useRiderUser } from './rider-workspace';
import s from './rider-availability.module.css';
type RiderStatus = {id:string;isAvailable:boolean;busy:boolean;branch:{name:string;isActive:boolean}|null};
export function RiderAvailability(){
 const user=useRiderUser(),cache=useQueryClient();const [saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');const locked=useRef(false);
 const query=useQuery({queryKey:['rider','availability',user?.id],queryFn:async({signal})=>(await api.get<{data:{rider:RiderStatus}}>('/riders/me',{signal})).data.data.rider,enabled:!!user,retry:false,refetchInterval:15000,refetchOnWindowFocus:true});
 async function change(){
  if(locked.current||!query.data||query.isError||query.data.busy)return;
  locked.current=true;setSaving(true);setError('');setMessage('');
  const next=!query.data.isAvailable;
  try{await api.patch(`/riders/${query.data.id}/availability`,{isAvailable:next});setMessage(next?'Availability saved. You can receive new assignments.':'Availability saved. You are offline for new assignments.');}
  catch(e){setError(getApiErrorMessage(e));}
  finally{await query.refetch();await cache.invalidateQueries({queryKey:['rider','deliveries',user?.id]});setSaving(false);locked.current=false;}
 }
 if(!user)return null;
 const rider=query.isError?undefined:query.data;
 const state=!rider?'unknown':rider.busy?'busy':rider.isAvailable?'available':'offline';
 const title=state==='unknown'?(query.isError?'Status unavailable':'Checking your status…'):state==='busy'?'On a delivery.':state==='available'?'Ready for your next journey.':'Taking a breather.';
 return <section className={s.card} data-state={state} data-rider-reveal aria-label="Rider availability"><div className={s.symbol} aria-hidden="true">{state==='available'?<Radio size={30}/>:state==='busy'?<Bike size={30}/>:<Moon size={27}/>}</div><div className={s.copy}><small><span className={s.dot}/>{state==='available'?'AVAILABLE':state==='busy'?'ON DELIVERY':state==='offline'?'OFFLINE':'YOUR AVAILABILITY'}{rider?.branch&&` · ${rider.branch.name}`}</small><h2>{title}</h2><p>{state==='busy'?'Your current assignment stays active. Availability returns automatically when your final active delivery closes.':state==='available'?'Your branch manager can assign your next delivery. Go offline when you need a break.':state==='offline'?'New assignments are paused. Switch to Available when you are ready.':'Your status must be confirmed before you can change it.'}</p>{rider?.branch&&!rider.branch.isActive&&<p className={s.notice}>Your branch is inactive. Contact your branch manager before accepting work.</p>}{rider&&!rider.branch&&<p className={s.notice}>You need a branch assignment before you can receive deliveries.</p>}{error&&<p className={s.error} role="alert">{error}</p>}{message&&<p className={s.notice} role="status">{message}</p>}{query.isError&&<p className={s.error} role="alert">{getApiErrorMessage(query.error)}</p>}</div><div className={s.controls}><button className={s.switch} role="switch" aria-label="Available for new deliveries" aria-checked={state==='available'} disabled={saving||!rider||rider.busy||(!rider.isAvailable&&!rider.branch?.isActive)} onClick={()=>void change()}><span>{saving?<Loader2 size={16} className={s.spin}/>:null}</span></button><span>{saving?'Saving…':state==='busy'?'Busy':state==='available'?'Available':state==='offline'?'Offline':'Unconfirmed'}</span><button className={s.refresh} aria-label="Refresh rider availability" disabled={saving||query.isFetching} onClick={()=>void query.refetch()}><RefreshCw size={15}/></button></div></section>;
}
