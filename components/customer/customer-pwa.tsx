'use client';
import { useEffect } from 'react';
export function CustomerPwa(){
 useEffect(()=>{
  // Native builds bundle their own files. Only the hosted HTTPS app installs a worker.
  if(process.env.NEXT_PUBLIC_NATIVE_BUILD==='1'||location.protocol!=='https:'||!('serviceWorker' in navigator))return;
  void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
 },[]);
 return null;
}
