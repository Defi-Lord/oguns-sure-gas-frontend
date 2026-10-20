'use client';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PackageCheck, RefreshCw, Truck } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import s from './staff-dispatch.module.css';
type Rider = {id:string;vehicleType:string|null;vehicleNumber:string|null;user:{firstName:string;lastName:string}};
export function StaffDispatch({orderId,status,paid,onUpdated}:{orderId:string;status:string;paid:boolean;onUpdated:()=>Promise<unknown>}) {
 const owner=useAuthStore(state=>state.user?.id);
 const client=useQueryClient(); const lock=useRef(false);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[chosen,setChosen]=useState(''),[error,setError]=useState('');
 const riders=useQuery({queryKey:['staff','available-riders',owner],queryFn:async()=> (await api.get<{data:{riders:Rider[]}}>('/orders/staff/available-riders')).data.data.riders,enabled:paid&&status==='READY_FOR_PICKUP',staleTime:0,refetchInterval:15000,retry:false});
 async function act(path:string,body:object,success:string){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try {await api.post(`/orders/staff/${orderId}/${path}`,body);setChosen('');setMessage(success);}
  catch(e){setError(getApiErrorMessage(e)+' Refresh the order before trying again.');}
  finally {await Promise.allSettled([client.invalidateQueries({queryKey:['staff','orders',owner]}),client.invalidateQueries({queryKey:['staff','available-riders',owner]}),onUpdated()]);lock.current=false;setBusy(false);}
 }
 const target=riders.data?.find(r=>r.id===chosen);
 return <section className={s.panel} aria-label="Prepare and dispatch"><div className={s.heading}><span><Truck size={22}/></span><div><small>BRANCH DISPATCH</small><h3>From your team to their door.</h3></div></div><ol className={s.steps}>{['Prepare','Ready','Assign rider'].map((v,i)=><li key={v} data-current={(i===0&&status==='CONFIRMED')||(i===1&&status==='PROCESSING')||(i===2&&status==='READY_FOR_PICKUP')}><b>{i+1}</b>{v}</li>)}</ol>
 {!paid?<p>Payment must be confirmed before this order can be prepared or dispatched.</p>:status==='CONFIRMED'?<><p>Start when your team begins preparing this order.</p><button disabled={busy} onClick={()=>void act('prepare',{status:'PROCESSING'},'Preparation started.')}><PackageCheck size={16}/>{busy?'Updating…':'Start preparing'}</button></>:status==='PROCESSING'?<><p>Check the items and cylinder details, then mark the order ready for rider pickup.</p><button disabled={busy} onClick={()=>void act('prepare',{status:'READY_FOR_PICKUP'},'Order is ready. Choose an available rider.')}><PackageCheck size={16}/>{busy?'Updating…':'Mark ready for pickup'}</button></>:status==='READY_FOR_PICKUP'?<><div className={s.refresh}><p>Available riders · your branch only</p><button aria-label="Refresh available riders" disabled={riders.isFetching||busy} onClick={()=>void riders.refetch()}><RefreshCw size={16}/></button></div>{riders.isPending?<p role="status">Checking rider availability…</p>:riders.isError?<p role="alert">{getApiErrorMessage(riders.error)}</p>:!riders.data.length?<p>No riders are available yet. This list refreshes every 15 seconds.</p>:<><label className={s.label}>Choose a rider<select value={chosen} onChange={e=>setChosen(e.target.value)} disabled={busy}><option value="">Select available rider</option>{riders.data.map(r=><option key={r.id} value={r.id}>{r.user.firstName} {r.user.lastName}{r.vehicleNumber?' · '+r.vehicleNumber:''}</option>)}</select></label>{target&&<p>Assign this order to <strong>{target.user.firstName} {target.user.lastName}</strong>{target.vehicleType?' · '+target.vehicleType:''}? They will receive a delivery notification.</p>}<button disabled={busy||!target||riders.isFetching} onClick={()=>void act('assign-rider',{riderId:chosen},'Rider assigned successfully.')}><Truck size={16}/>{busy?'Assigning…':'Confirm rider assignment'}</button></>}</>:<p>{['ASSIGNED','OUT_FOR_DELIVERY'].includes(status)?'A rider is handling this delivery.':'No dispatch action is available for this order.'}</p>}
 {message&&<p role="status" className={s.success}>{message}</p>}{error&&<p role="alert" className={s.error}>{error}</p>}</section>;
}

export function StaffRiderRoster(){
 const owner=useAuthStore(state=>state.user?.id);
 const riders=useQuery({queryKey:['staff','available-riders',owner],queryFn:async()=> (await api.get<{data:{riders:Rider[]}}>('/orders/staff/available-riders')).data.data.riders,staleTime:0,refetchInterval:15000,retry:false});
 return <details className={s.panel}><summary className={s.rosterSummary}><Truck size={20}/><strong>Available riders</strong><span>{riders.isSuccess?riders.data.length:'—'} in your branch</span></summary><p>Active riders who are online and have no active delivery. Refreshes every 15 seconds.</p>{riders.isPending?<p role="status">Loading riders…</p>:riders.isError?<p role="alert">{getApiErrorMessage(riders.error)}</p>:!riders.data.length?<p>No riders available right now.</p>:<ul className={s.roster}>{riders.data.map(r=><li key={r.id}><span>{r.user.firstName} {r.user.lastName}<small>{[r.vehicleType,r.vehicleNumber].filter(Boolean).join(' · ')||'Vehicle details not supplied'}</small></span><b>Available</b></li>)}</ul>}<button disabled={riders.isFetching} onClick={()=>void riders.refetch()}><RefreshCw size={15}/>Refresh riders</button><p>Open a ready order below to assign a rider.</p></details>;
}
