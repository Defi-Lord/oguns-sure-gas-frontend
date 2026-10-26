'use client';
import { CylinderPhotoView } from '@/components/shared/cylinder-photo';
import { useRef, useState } from 'react';
import { Check, CheckCircle2, LoaderCircle, Scale, Truck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '@/lib/api/client';
import type { Delivery, DeliveryResponse } from '@/types/delivery';
import { useRiderUser } from './rider-workspace';
import s from './rider-actions.module.css';
import { announceMoment } from '@/lib/experience/moment-policy';
import { RiderTracking } from './rider-tracking';
import { RiderPhotoInput } from './rider-photo-input';

type Intent={title:string;method:'post'|'patch';path:string;body:Record<string,string|number>;summary:string;version:string;photo?:File;photoStage?:'pickup'|'delivery'};
const stages=['ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED'];
const labels=['Assigned','Picked up','On the way','Delivered'];
const version=(d:Delivery)=>JSON.stringify([d.status,d.gasVerification?.id,d.gasVerification?.pickupWeightKg,d.gasVerification?.deliveryWeightKg,d.gasVerification?.verificationStatus]);

export function RiderActions({delivery,onRefresh}:{delivery:Delivery;onRefresh:()=>Promise<unknown>}){
 const user=useRiderUser();const client=useQueryClient();const locked=useRef(false);
 const [intent,setIntent]=useState<Intent|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [gasOpen,setGasOpen]=useState(false);
 const terminal=['DELIVERED','FAILED','CANCELLED'].includes(delivery.status);const gas=delivery.gasVerification;const index=stages.indexOf(delivery.status);
 const next=delivery.status==='ASSIGNED'?{status:'PICKED_UP',title:'Confirm pickup',summary:'I have collected the items for this delivery.'}:delivery.status==='PICKED_UP'?{status:'IN_TRANSIT',title:'Start journey',summary:'I am leaving the branch and heading to the customer.'}:delivery.status==='IN_TRANSIT'?{status:'DELIVERED',title:'Complete delivery',summary:'I have handed the complete order to the customer.'}:null;
 const blocked=!!gas&&((next?.status==='DELIVERED'&&gas.verificationStatus!=='VERIFIED')||(next?.status==='IN_TRANSIT'&&gas.pickupWeightKg==null));
 function review(title:string,method:Intent['method'],path:string,body:Intent['body'],summary:string,photo?:File,photoStage?:'pickup'|'delivery'){setError('');setNotice('');setIntent({title,method,path,body,summary,version:version(delivery),photo,photoStage});}
 function gasReview(event:React.FormEvent<HTMLFormElement>,kind:'create'|'pickup'|'delivery'){
  event.preventDefault();const form=new FormData(event.currentTarget);const weight=Number(form.get('weight'));
  if(!Number.isFinite(weight)||weight<=0){setError('Enter a cylinder weight or gas quantity greater than zero.');return;}
  const notes=String(form.get('notes')??'').trim();if(notes.length>1000){setError('Notes must be 1,000 characters or fewer.');return;}
  if(kind==='delivery'&&gas?.pickupWeightKg!=null&&weight<Number(gas.pickupWeightKg)){setError('The final cylinder weight cannot be below the recorded pickup weight.');return;}
  const selected=form.get('photo');const photo=selected instanceof File&&selected.size>0?selected:undefined;
  if(photo&&(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>5*1024*1024)){setError('Choose a JPEG, PNG or WebP photo, 5 MB or smaller.');return;}
  const key=kind==='create'?'expectedGasKg':kind==='pickup'?'pickupWeightKg':'deliveryWeightKg';
  review(kind==='create'?'Set up gas verification':kind==='pickup'?'Save pickup weight':'Save final weight',kind==='create'?'post':'patch',`/deliveries/${delivery.id}/gas-verification${kind==='create'?'':'/'+kind}`,{[key]:weight,...(kind!=='create'&&notes?{riderNotes:notes}:{})},`${kind==='create'?'Requested gas quantity':kind==='pickup'?'Empty cylinder pickup weight':'Filled cylinder final weight'}: ${weight} kg.${notes?' Notes: '+notes:''}${photo?' Photo: '+photo.name:''}`,photo,kind==='create'?undefined:kind);
 }
 async function save(){
  if(!intent||locked.current||!user)return;locked.current=true;setBusy(true);setError('');let sent=false;
  try{
   const fresh=(await api.get<DeliveryResponse>(`/deliveries/${delivery.id}`)).data.data.delivery;
   if(version(fresh)!==intent.version){await onRefresh();setIntent(null);setError('This delivery changed. Review the refreshed details before choosing an action.');return;}
   const body={...intent.body};
   if(intent.photo&&intent.photoStage){const form=new FormData();form.append('photo',intent.photo);setNotice('Uploading cylinder photo…');const uploaded=(await api.post<{data:{photo:{url:string}}}>(`/deliveries/${delivery.id}/gas-verification/photos/${intent.photoStage}`,form,{headers:{'Content-Type':undefined}})).data.data.photo;body[intent.photoStage==='pickup'?'pickupPhotoUrl':'deliveryPhotoUrl']=uploaded.url;}
   sent=true;await api[intent.method](intent.path,body);
   const stage=String(body.status??'');
   if(['PICKED_UP','IN_TRANSIT','DELIVERED'].includes(stage)) announceMoment(user.id,{key:`RIDER:${delivery.order.id}:${stage}`,kind:'success',title:stage==='DELIVERED'?'Well done!':stage==='PICKED_UP'?'Pickup confirmed':'Journey started',message:stage==='DELIVERED'?`${delivery.order.orderNumber} delivered. Another doorstep, another smile.`:delivery.order.orderNumber,duration:stage==='DELIVERED'?3000:1000});
   setIntent(null);setNotice('Saved. Refreshing your delivery…');
   await client.invalidateQueries({queryKey:['rider','deliveries',user.id]});await client.invalidateQueries({queryKey:['rider','delivery',user.id,delivery.id]});await onRefresh();setNotice('Your delivery is up to date.');
  }catch(e){setIntent(null);setError(`${getApiErrorMessage(e)}${sent?' Refresh the delivery to check whether the update was saved before trying again.':''}`);if(sent)await onRefresh();}
  finally{locked.current=false;setBusy(false);}
 }
 return <section className={s.workflow} aria-label="Delivery workflow" aria-busy={busy}>
  <div className={s.heading}><span><Truck size={20}/></span><div><small>YOUR NEXT MOVE</small><h3>Delivery progress</h3></div></div>
  <CylinderPhotoView key={delivery.order.id} orderId={delivery.order.id}/><ol className={s.steps}>{labels.map((name,i)=><li key={name} data-done={index>=i} aria-current={index===i?'step':undefined}><span>{index>i?<Check size={13}/>:i+1}</span><small>{name}</small></li>)}</ol>
  {error&&<p className={s.error} role="alert">{error}</p>}{notice&&<p className={s.success} role="status">{notice}</p>}
  {terminal?<p className={s.finished}><CheckCircle2 size={19}/> This delivery is {delivery.status.toLowerCase()}.</p>:<>
   {gas&&<div className={s.gasSummary}><Scale size={19}/><div><strong>Gas verification · {gas.verificationStatus.toLowerCase()}</strong><p>Requested: {gas.expectedGasKg} kg · Pickup: {gas.pickupWeightKg??'Not recorded'}{gas.pickupWeightKg!=null?' kg':''}</p><p>Final: {gas.deliveryWeightKg??'Not recorded'}{gas.deliveryWeightKg!=null?' kg':''}{gas.gasSuppliedKg!=null?` · Supplied: ${gas.gasSuppliedKg} kg`:''}</p>{gas.pickupPhotoUrl?.startsWith('https://')&&<a className={s.secondary} href={gas.pickupPhotoUrl} target="_blank" rel="noopener noreferrer">View pickup photo</a>}{gas.deliveryPhotoUrl?.startsWith('https://')&&<a className={s.secondary} href={gas.deliveryPhotoUrl} target="_blank" rel="noopener noreferrer">View delivery photo</a>}{gas.verificationStatus==='DISCREPANCY'&&<p className={s.error}>Quantity discrepancy: {gas.discrepancyKg} kg. Contact your branch manager before completion.</p>}</div></div>}
   {!intent&&<>
    {next?<button className={s.primary} disabled={busy||blocked} onClick={()=>review(next.title,'patch',`/deliveries/${delivery.id}/status`,{status:next.status},next.summary)}>{next.title}<Truck size={17}/></button>:<p>Waiting for branch assignment. Contact your branch manager.</p>}
    {blocked&&<p className={s.hint}>{next?.status==='IN_TRANSIT'?'Record the empty cylinder pickup weight before starting your journey.':'Complete gas verification before confirming delivery.'}</p>}
    {!gas&&['ASSIGNED','PICKED_UP','IN_TRANSIT'].includes(delivery.status)&&<><button className={s.secondary} disabled={busy} onClick={()=>setGasOpen(v=>!v)}><Scale size={16}/> {gasOpen?'Hide gas setup':'This order includes a gas refill'}</button>{gasOpen&&<form onSubmit={e=>gasReview(e,'create')}><p className={s.hint}>Enter the requested gas quantity from this order. If unclear, confirm it with your branch manager.</p><label>Requested gas quantity (kg)<input name="weight" type="number" min="0.001" step="any" required disabled={busy}/></label><button className={s.secondary} disabled={busy}>Review gas setup</button></form>}</>}
    {gas&&delivery.status==='PICKED_UP'&&gas.pickupWeightKg==null&&gas.deliveryWeightKg==null&&<form onSubmit={e=>gasReview(e,'pickup')}><h4>Empty cylinder pickup</h4><label>Empty cylinder weight (kg)<input name="weight" type="number" min="0.001" step="any" required disabled={busy}/></label><RiderPhotoInput/><label>Rider notes (optional)<textarea name="notes" maxLength={1000} disabled={busy}/></label><button className={s.secondary} disabled={busy}>Review pickup weight</button></form>}
    {gas&&['PICKED_UP','IN_TRANSIT'].includes(delivery.status)&&gas.pickupWeightKg!=null&&gas.deliveryWeightKg==null&&<form onSubmit={e=>gasReview(e,'delivery')}><h4>Filled cylinder measurement</h4><p className={s.hint}>Weigh the filled cylinder. The server checks supplied gas against the requested quantity.</p><label>Final cylinder weight (kg)<input name="weight" type="number" min="0.001" step="any" required disabled={busy}/></label><RiderPhotoInput/><label>Rider notes (optional)<textarea name="notes" maxLength={1000} disabled={busy}/></label><button className={s.secondary} disabled={busy}>Review final weight</button></form>}
    {gas&&delivery.status==='IN_TRANSIT'&&gas.pickupWeightKg==null&&<p className={s.error}>Pickup weight is missing. Contact your branch manager; the backend accepts pickup measurements only in the picked-up stage.</p>}
   </>}
  </>}
  {intent&&<div className={s.confirm} role="region" aria-label="Confirm delivery action"><h4>{intent.title}?</h4><p>{delivery.order.orderNumber} · {intent.summary}</p><div><button className={s.secondary} disabled={busy} onClick={()=>setIntent(null)}>Go back</button><button className={s.primary} disabled={busy} onClick={()=>void save()}>{busy?<><LoaderCircle size={16}/> Saving…</>:'Confirm and save'}</button></div></div>}
 <RiderTracking key={delivery.id} delivery={delivery}/>
 </section>;
}
