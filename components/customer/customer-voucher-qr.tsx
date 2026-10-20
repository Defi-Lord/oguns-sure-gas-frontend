'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Download, Expand, Loader2, ScanLine, ShieldCheck, X } from 'lucide-react';
import s from './customer-voucher-qr.module.css';

/** Encodes the exact server-issued token locally; never contacts a QR provider. */
export function CustomerVoucherQr({token,code}:{token:string;code:string}){
 const canvas=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDialogElement>(null);
 const [png,setPng]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{
  let alive=true;const element=canvas.current;
  if(!element)return;
  void import('qrcode').then(async({default:qr})=>{
   if(!alive)return;
   if(!token.trim()||token.length>4096)throw new Error('Invalid voucher token');
   await qr.toCanvas(element,token,{width:512,margin:4,errorCorrectionLevel:'M',color:{dark:'#173F30',light:'#FFFFFF'}});
   if(alive)setPng(element.toDataURL('image/png'));
  }).catch(()=>{if(alive)setFailed(true);});
  return()=>{alive=false;};
 },[token]);
 return <section className={s.section} aria-label="Voucher scan code">
  <header><span className={s.icon}><ScanLine size={20}/></span><div><h3>Scan your reward.</h3><p>Show this QR code to MySureGas staff.</p></div><span className={s.live} aria-label="Server-issued voucher">READY TO SHOW</span></header>
  <div className={s.frame} data-ready={Boolean(png)}>
   <span className={s.corner} aria-hidden="true"/>
   <canvas ref={canvas} className={png?s.canvas:s.hiddenCanvas} role="img" aria-label={`Voucher QR code for ${code}`} width={512} height={512}/>
   {!png&&<div className={s.placeholder} role="status">{failed?<><ScanLine size={30}/><strong>Use your written voucher code.</strong><span>The QR image could not be generated.</span></>:<><Loader2 size={27} className={s.spin}/><span>Preparing your scan code…</span></>}</div>}
  </div>
  {png&&<div className={s.actions}><button type="button" onClick={()=>dialog.current?.showModal()}><Expand size={15}/> Enlarge QR</button><a href={png} download="MySureGas-Voucher-QR.png"><Download size={15}/> Save QR image</a></div>}
  <p className={s.note}><ShieldCheck size={14}/> Keep it private. Staff check validity before confirming redemption.</p>
  <dialog ref={dialog} className={s.dialog} aria-label="Enlarged voucher QR code" onClick={event=>{if(event.target===event.currentTarget)dialog.current?.close();}}>
   <header><div><span>MYSUREGAS REWARD</span><h3>Ready for your reward?</h3></div><button type="button" aria-label="Close enlarged QR" onClick={()=>dialog.current?.close()} autoFocus><X size={21}/></button></header>
   {png&&<Image src={png} alt={`Enlarged voucher QR code for ${code}`} width={512} height={512} unoptimized className={s.largeQr}/>}
   <p className={s.writtenCode}>{code}</p><p className={s.dialogNote}>Hold your screen steady while staff scan. Scanning alone does not redeem the voucher.</p>
  </dialog>
 </section>;
}
