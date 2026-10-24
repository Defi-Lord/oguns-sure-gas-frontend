'use client';
import { Capacitor } from '@capacitor/core';
import { useSyncExternalStore } from 'react';
const subscribe=()=>()=>{};
const messageOf=(cause:unknown)=>typeof cause==='string'?cause:typeof cause==='object'&&cause!==null&&'message' in cause&&typeof cause.message==='string'?cause.message:'The device could not complete this request.';
export const isNativeDevice=()=>Capacitor.isNativePlatform();
export const useNativeDevice=()=>useSyncExternalStore(subscribe,isNativeDevice,()=>false);
export type DevicePosition={coords:{latitude:number;longitude:number;accuracy:number}};
export function getDevicePosition(success:(position:DevicePosition)=>void,failure:(cause:{code:number;message:string})=>void,options:PositionOptions={}){
 if(!isNativeDevice()){
  if(!navigator.geolocation){failure({code:2,message:'Location is unavailable.'});return;}
  navigator.geolocation.getCurrentPosition(success,failure,options);return;
 }
 void (async()=>{
  const {Geolocation}=await import('@capacitor/geolocation');
  let permission=await Geolocation.checkPermissions();
  if(permission.location==='prompt'||permission.location==='prompt-with-rationale')permission=await Geolocation.requestPermissions({permissions:['location']});
  if(permission.location==='denied'&&permission.coarseLocation!=='granted'){failure({code:1,message:'Location permission was declined.'});return;}
  success(await Geolocation.getCurrentPosition({enableHighAccuracy:options.enableHighAccuracy??false,timeout:options.timeout??15000,maximumAge:options.maximumAge??0}));
 })().catch((cause:unknown)=>{const message=messageOf(cause);failure({code:/denied|permission/i.test(message)?1:2,message});});
}
export async function chooseNativeCylinderPhoto():Promise<File|null>{
 if(!isNativeDevice())throw new Error('Use the photo controls in your browser.');
 const {Camera,CameraResultType,CameraSource}=await import('@capacitor/camera');
 try{
  const photo=await Camera.getPhoto({resultType:CameraResultType.Uri,source:CameraSource.Prompt,quality:85,width:1600,height:1600,allowEditing:false,saveToGallery:false,promptLabelHeader:'Your cylinder photo',promptLabelPhoto:'Choose from photos',promptLabelPicture:'Take a photo'});
  if(!photo.webPath)throw new Error('The selected photo could not be read.');
  const response=await fetch(photo.webPath);if(!response.ok)throw new Error('The selected photo could not be read.');
  const blob=await response.blob();if(blob.size===0||blob.size>5*1024*1024)throw new Error('Choose a photo up to 5 MB.');
  return new File([blob],`cylinder-${Date.now()}.jpg`,{type:'image/jpeg'});
 }catch(cause){if(/cancel|no image picked/i.test(messageOf(cause)))return null;throw new Error(messageOf(cause));}
}
