'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame, Play, RotateCcw, Sparkles } from 'lucide-react';
import type { Moment } from '@/lib/experience/moment-policy';
import { MomentCard } from './experience-moments';
import s from './moment-preview.module.css';
const examples: (Moment & { label: string; role: string; note: string })[] = [
  {key:'assignment',kind:'assignment',title:'A new delivery for you',message:'MSG-1024 is ready to review in Deliveries.',duration:3000,label:'New assignment',role:'RIDER',note:'Order-slip arrival and a moving rider'},
  {key:'pickup',kind:'success',title:'Pickup confirmed',message:'MSG-1024 · Ready for your next step.',duration:1000,label:'Pickup confirmed',role:'RIDER',note:'A one-second checkmark confirmation'},
  {key:'complete',kind:'success',title:'Well done, Tunde!',message:'MSG-1024 delivered. Another doorstep, another smile.',duration:3000,label:'Delivery complete',role:'RIDER',note:'Medal reveal and a celebration burst'},
  {key:'tip',kind:'tip',title:'You got tipped!',message:'A little kindness. A big difference.',tipId:'demo-tip',duration:8000,label:'Tip received',role:'RIDER',note:'Gift reveal, confetti and an animated amount'},
  {key:'reward',kind:'reward',title:'You won a giveaway!',message:'Your reward is waiting in My vouchers. Check its expiry and redemption details.',duration:5000,label:'Giveaway winner',role:'CUSTOMER',note:'An opening gift with a rising gold star'},
  {key:'thanks',kind:'thanks',title:'Tunde says thank you!',message:'MSG-1024 · Your kindness made their day.',duration:4000,label:'Customer thank-you',role:'CUSTOMER',note:'Two hearts coming together'},
  {key:'cart',kind:'gentle',variant:'cart',title:'Added to your bag',message:'5 kg of cooking gas',duration:1800,label:'Added to bag',role:'CUSTOMER',note:'A small parcel drops into the bag'},
  {key:'save',kind:'gentle',variant:'saved',title:'Looking good!',message:'Your profile changes are saved.',duration:1800,label:'Details saved',role:'CUSTOMER',note:'A compact, non-blocking confirmation'},
  {key:'confirmed',kind:'thanks',title:'You’re all set!',message:'MSG-1024 is confirmed. Thank you for shopping with us.',duration:3000,label:'Order confirmed',role:'CUSTOMER',note:'A warm welcome for a confirmed order'},
  {key:'entry',kind:'gentle',title:'Your tasks are approved',message:'Thank you for taking part. Winner selection is still pending.',duration:3500,label:'Entry approved',role:'CUSTOMER',note:'Gentle encouragement, without a winning claim'},
];
export function MomentPreview() {
  const [selected,setSelected]=useState(0),[moment,setMoment]=useState<(Moment & {role:string})|null>(null);
  function play(index:number){const example=examples[index];if(!example)return;setSelected(index);setMoment({...example,key:`demo:${example.key}:${crypto.randomUUID()}`});}
  const key=moment?.key;
  const dismiss=useCallback(()=>setMoment(current=>current?.key===key?null:current),[key]);
  return <main className={s.page}><div className={s.wrap}><header><Link href="/shop"><ArrowLeft size={16}/>Back to MySureGas</Link><span><Flame size={19}/>MySureGas</span></header><section className={s.hero}><span className={s.pill}><Sparkles size={13}/> THE LITTLE MOMENTS MATTER</span><h1>Good energy.<br/><em>Now in motion.</em></h1><p>Replay the same animation components used in the app. Choose a moment below to see its complete sequence.</p><div className={s.demo}>DEMO · Sample names, orders and amounts. These previews never create an order, charge money or send a message.</div><button className={s.replay} onClick={()=>play(selected)}><RotateCcw size={17}/>Replay selected moment</button></section><div className={s.grid}>{examples.map((example,index)=><button key={example.key} className={s.tile} data-selected={selected===index} onClick={()=>play(index)} aria-label={`Preview ${example.label.toLowerCase()}`}><span className={s.number}>{String(index+1).padStart(2,'0')}</span><div><h2>{example.label}</h2><p>{example.note}</p><small>{example.duration/1000} sec · {example.role==='RIDER'?'Rider':'Customer'}</small></div><Play size={17}/></button>)}</div><footer>Animations respect your device’s reduced-motion preference. This preview changes no account data.</footer></div>{moment&&<MomentCard key={moment.key} moment={moment} role={moment.role} dismiss={dismiss} demo onDemoThanks={()=>play(5)}/>}</main>;
}
