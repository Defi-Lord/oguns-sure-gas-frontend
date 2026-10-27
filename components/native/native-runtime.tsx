'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { PluginListenerHandle } from '@capacitor/core';
import { isNativeDevice } from '@/lib/native/device';
import { externalBrowserUrl, nativeDestination, nativeBackDestination } from '@/lib/native/navigation';
export function NativeRuntime(){
 const router=useRouter(),queries=useQueryClient();const [error,setError]=useState('');
 useEffect(()=>{
  if(!isNativeDevice())return;
  document.documentElement.dataset.mysuregasNative='true';
  let disposed=false;const handles:PluginListenerHandle[]=[];
  const refresh=()=>{if(!disposed){window.dispatchEvent(new Event('focus'));void queries.invalidateQueries({predicate:q=>q.queryKey[0]==='customer',refetchType:'active'});}};
  const track=async(promise:Promise<PluginListenerHandle>)=>{const handle=await promise;if(disposed)await handle.remove();else handles.push(handle);};
  const external=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   const target=event.target instanceof Element?event.target.closest('a[href]'):null;if(!(target instanceof HTMLAnchorElement))return;
   const url=externalBrowserUrl(target.href,location.origin);if(!url)return;
   event.preventDefault();event.stopPropagation();
   void import('@capacitor/browser').then(({Browser})=>Browser.open({url,toolbarColor:'#fffef9'})).catch(()=>{if(!disposed)setError('The secure browser could not open. Please try again.');});
  };
  document.addEventListener('click',external,true);
  void (async()=>{
   const [{App},{Browser}]=await Promise.all([import('@capacitor/app'),import('@capacitor/browser')]);
   if(disposed)return;
   await track(App.addListener('appStateChange',state=>{if(state.isActive)refresh();}));
   await track(Browser.addListener('browserFinished',refresh));
   await track(App.addListener('appUrlOpen',({url})=>{const path=nativeDestination(url,location.pathname);if(path){router.push(path);refresh();}}));
   if((await import('@capacitor/core')).Capacitor.getPlatform()==='android')await track(App.addListener('backButton',({canGoBack})=>{
    const dialogs=document.querySelectorAll<HTMLDialogElement>('dialog[open]'),dialog=dialogs[dialogs.length-1];
    if(dialog){if(dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close();return;}
    if(canGoBack)window.history.back();else {const fallback=nativeBackDestination(location.pathname);if(fallback)router.replace(fallback);else void App.minimizeApp();}
   }));
   const launch=await App.getLaunchUrl();const path=launch?nativeDestination(launch.url,location.pathname):null;if(path&&!disposed)router.replace(path);
  })().catch(()=>{if(!disposed)setError('Some device controls could not start. Reopen the app or contact support.');});
  return()=>{disposed=true;document.removeEventListener('click',external,true);for(const handle of handles)void handle.remove();};
 },[queries,router]);
 return error?<div role="alert" style={{position:'fixed',zIndex:1000,bottom:'calc(80px + env(safe-area-inset-bottom))',left:16,right:16,padding:16,borderRadius:14,background:'#fff7e9',color:'#583e1f',border:'1px solid #e4c99c',fontSize:13}}>{error}<button type="button" onClick={()=>setError('')} style={{marginLeft:12}}>Dismiss</button></div>:null;
}
