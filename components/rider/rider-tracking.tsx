'use client';
import { useEffect, useState } from 'react';
import { LocateFixed, Navigation, Square } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import type { Delivery } from '@/types/delivery';
import s from './rider-actions.module.css';
type Location={latitude:number;longitude:number;accuracy:number|null;recordedAt:string};
export function RiderTracking({delivery}:{delivery:Delivery}){
 const [sharing,setSharing]=useState(false);const [last,setLast]=useState<Location|null>(null);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const allowed=['PICKED_UP','IN_TRANSIT'].includes(delivery.status);
 useEffect(()=>{
  if(!sharing||!allowed)return;
  let active=true,pending=false;const controller=new AbortController();
  function locate(){
   if(!active||pending)return;pending=true;
   navigator.geolocation.getCurrentPosition(position=>{
    if(!active)return;
    const c=position.coords;
    const body={deliveryId:delivery.id,latitude:c.latitude,longitude:c.longitude,...(Number.isFinite(c.accuracy)&&c.accuracy>=0?{accuracy:c.accuracy}:{}),...(c.heading!=null&&Number.isFinite(c.heading)&&c.heading>=0&&c.heading<360?{heading:c.heading}:{}),...(c.speed!=null&&Number.isFinite(c.speed)&&c.speed>=0?{speed:c.speed}:{})};
    void api.patch<{data:{location:Location}}>('/tracking/location',body,{signal:controller.signal}).then(response=>{if(active){setLast(response.data.data.location);setError('');setMessage('Location sent successfully.');}}).catch(e=>{if(active){setError(getApiErrorMessage(e));setMessage('Location update failed.');const status=(e as {response?:{status:number}}).response?.status;if(status&&[400,401,403,404].includes(status))setSharing(false);}}).finally(()=>{pending=false;});
   },e=>{if(active){pending=false;setError(e.code===1?'Location permission was denied. Allow location access in your browser, then try again.':e.code===2?'Your device could not find its location. Check GPS and try again.':'Location timed out. Move to an area with better GPS reception and try again.');setSharing(false);}},{enableHighAccuracy:true,maximumAge:5000,timeout:12000});
  }
  function visibility(){if(document.hidden){setSharing(false);setMessage('Sharing paused because this page is in the background.');}}
  locate();const interval=window.setInterval(locate,10000);document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;controller.abort();window.clearInterval(interval);document.removeEventListener('visibilitychange',visibility);};
 },[sharing,allowed,delivery.id]);
 function start(){if(!window.isSecureContext){setError('Location sharing needs HTTPS or localhost.');return;}if(!navigator.geolocation){setError('Location is unavailable on this device.');return;}setError('');setMessage('Finding your location…');setSharing(true);}
 if(!allowed)return null;
 return <section className={s.tracking} aria-label="Live delivery tracking"><div className={s.heading}><span><LocateFixed size={20}/></span><div><small>LIVE JOURNEY</small><h3>Share your location</h3></div></div><p className={s.hint}>Keep this delivery open in the foreground. While sharing, GPS updates are sent every 10 seconds. Closing the delivery or leaving the page stops sharing.</p><button className={sharing?s.secondary:s.primary} onClick={sharing?()=>{setSharing(false);setMessage('Location sharing stopped.');}:start}>{sharing?<><Square size={15}/> Stop sharing</>:<><Navigation size={16}/> Start location sharing</>}</button><p role="status" className={s.hint}>{message||'Location sharing is off.'}</p>{error&&<p className={s.error} role="alert">{error}</p>}{last&&<div className={s.gasSummary}><div><strong>Last successful update</strong><p>{new Date(last.recordedAt).toLocaleTimeString('en-NG')} · {last.accuracy==null?'Accuracy unavailable':`Accuracy ±${Math.round(last.accuracy)} m`}</p><a className={s.secondary} href={`https://www.google.com/maps/search/?api=1&query=${last.latitude},${last.longitude}`} target="_blank" rel="noopener noreferrer">View sent position</a></div></div>}</section>;
}
