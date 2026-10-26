'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bike, Loader2, Moon, Radio, RefreshCw } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useRiderUser } from './rider-workspace';
import s from './rider-home.module.css';
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
 return <div className={s.welcome}>
  <div className={s.greeting}><div><span>{rider?.branch?.name ? `${rider.branch.name} BRANCH` : 'YOUR RIDER WORKSPACE'}</span><h1>Hello, {user.firstName}.</h1><p>Ready for your next delivery?</p></div><div className={s.availability}><button className={s.switch} role="switch" aria-label="Available for new deliveries" aria-checked={state==='available'} disabled={saving||!rider||rider.busy||(!rider.isAvailable&&!rider.branch?.isActive)} onClick={()=>void change()}><span>{saving?<Loader2 size={14} className={s.spin}/>:null}</span></button><span>{saving?'Saving…':state==='busy'?'Busy':state==='available'?'Available':state==='offline'?'Offline':'Checking'}</span></div></div>
  <section className={s.online} data-state={state} aria-label="Rider availability"><span className={s.beacon} aria-hidden="true">{state==='available'?<Radio size={24}/>:state==='busy'?<Bike size={24}/>:<Moon size={23}/>}</span><div><h2>{state==='available'?'You’re online':state==='busy'?'Delivery in progress':state==='offline'?'You’re offline':title}</h2><p>{state==='available'?'Ready for branch assignments':state==='busy'?'Keep sharing good energy.':state==='offline'?'Go available when you’re ready.':'Checking your availability.'}</p></div><span className={s.routeArt} aria-hidden="true"><i/><b/><i/></span><button className={s.refreshStatus} aria-label="Refresh rider availability" disabled={saving||query.isFetching} onClick={()=>void query.refetch()}><RefreshCw size={15}/></button></section>
  {rider?.branch&&!rider.branch.isActive&&<p className={s.notice}>Your branch is inactive. Contact your branch manager before accepting work.</p>}{rider&&!rider.branch&&<p className={s.notice}>A branch assignment is needed before you can receive deliveries.</p>}{error&&<p className={s.error} role="alert">{error}</p>}{message&&<p className={s.notice} role="status">{message}</p>}{query.isError&&<p className={s.error} role="alert">{getApiErrorMessage(query.error)}</p>}
 </div>;
}
