'use client';
import { useEffect } from 'react';
export function WebAppWorker(){
 useEffect(()=>{
  // Native builds bundle their own files. The hosted portals share one worker.
  if(process.env.NEXT_PUBLIC_NATIVE_BUILD==='1'||!window.isSecureContext||!('serviceWorker' in navigator))return;
  void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
 },[]);
 return null;
}
