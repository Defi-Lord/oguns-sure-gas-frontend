'use client';
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Moment } from '@/lib/experience/moment-policy';
import s from './experience-moments.module.css';
export function momentScene(moment: Moment) {
  if (moment.kind === 'assignment') return 'assignment';
  if (moment.variant === 'cart') return 'cart';
  if (moment.kind === 'tip') return 'tip';
  if (moment.kind === 'reward') return 'reward';
  if (moment.duration <= 2000) return 'quick';
  if (moment.kind === 'success') return 'complete';
  if (moment.kind === 'thanks') return 'thanks';
  return 'gentle';
}
export function MomentArtwork({ scene }: { scene: string }) {
  return <div className={s.artwork} data-scene={scene} aria-hidden="true">
    <div className={s.aura} /><div className={s.orbitOne} /><div className={s.orbitTwo} />
    {['reward','tip'].includes(scene) ? <div className={s.giftScene}>
      <div className={s.boxShadow}/><div className={s.boxBody}><span/><i/></div><div className={s.boxLid}><i/><b/></div>
      <div className={s.prize}>{scene==='tip'?<span>₦</span>:<svg viewBox="0 0 64 64"><path d="m32 8 7 15 17 2-12 12 3 18-15-9-15 9 3-18L8 25l17-2Z" fill="currentColor"/></svg>}</div>
      <div className={s.giftSparkles}>{Array.from({length:8},(_,i)=><i key={i} style={{'--angle':`${i*45}deg`,'--delay':`${i*40}ms`} as CSSProperties}/>)}</div>
    </div> : scene==='assignment' ? <div className={s.assignmentScene}>
      <svg className={s.route} viewBox="0 0 260 110"><path d="M20 90C80 90 45 18 121 23s61 58 119-7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 7"/><circle cx="20" cy="90" r="6"/><circle cx="240" cy="16" r="6"/></svg>
      <div className={s.orderSlip}><span className={s.slipCheck}>✓</span><i/><i/><b/></div>
      <svg className={s.scooter} viewBox="0 0 160 100"><g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><circle cx="35" cy="75" r="17"/><circle cx="125" cy="75" r="17"/><path d="M35 75 60 36l26 39H35m51 0 26-42h15l-2 42M58 34h27m-5-13 16 19 13 3"/><circle cx="82" cy="10" r="8" fill="currentColor"/></g></svg>
    </div> : scene==='thanks' ? <div className={s.heartScene}><svg viewBox="0 0 100 100" className={s.heartLeft}><path d="M50 83 17 51C-5 24 31 7 50 29 69 7 105 24 83 51Z" fill="currentColor"/></svg><svg viewBox="0 0 100 100" className={s.heartRight}><path d="M50 83 17 51C-5 24 31 7 50 29 69 7 105 24 83 51Z" fill="currentColor"/></svg><div className={s.heartSpark}>✦</div></div>
    : scene==='cart' ? <div className={s.cartScene}><svg viewBox="0 0 110 105"><g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M25 36h61l-6 54H31Z" fill="#e3f4d8"/><path d="M42 36V25a13 13 0 0 1 26 0v11"/></g></svg><span className={s.cartParcel}>✓</span></div>
    : <div className={s.medalScene} data-soft={scene==='gentle'}>{scene==='complete'&&<div className={s.ribbon}><i/><i/></div>}
      <svg viewBox="0 0 120 120" className={s.medal}><defs><linearGradient id={`medal-${scene}`} x1="0" x2="1" y2="1"><stop stopColor="#f7ffe5"/><stop offset="1" stopColor="#d1e9a9"/></linearGradient></defs><circle className={s.medalFill} cx="60" cy="60" r="45" fill={`url(#medal-${scene})`}/><circle className={s.drawRing} cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="3" pathLength="1"/>{scene==='gentle'?<path className={s.drawTick} d="M43 70q0-31 35-30-1 30-35 30Zm0 0 22-18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength="1"/>:<path className={s.drawTick} d="m39 60 14 14 28-29" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength="1"/>}</svg>
      <div className={s.medalStars}><i>✦</i><i>✧</i><i>✦</i></div>
    </div>}
  </div>;
}
export function MomentParticles({ scene }: { scene: string }) {
  if (!['tip','reward','complete'].includes(scene)) return null;
  const count=scene==='complete'?36:64;
  return <div className={s.confetti} aria-hidden="true">{Array.from({length:count},(_,i)=>{
    const left=i%2===0, speed=140+(i*37)%270;
    return <i key={i} style={{left:left?'4%':'96%','--dx':`${(left?1:-1)*speed}px`,'--rise':`${-110-(i*29)%230}px`,'--fall':`${190+(i*43)%440}px`,'--turn':`${(i%2?1:-1)*(250+i*31)}deg`,'--delay':`${(i%8)*40}ms`,'--life':`${1800+(i%6)*130}ms`} as CSSProperties}/>;
  })}</div>;
}
export function MomentAmount({ value }: { value: string }) {
  const element=useRef<HTMLSpanElement>(null);
  const amount=Number(value), valid=Number.isFinite(amount)&&amount>=0;
  const format=(number:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:2,maximumFractionDigits:2}).format(number);
  const final=valid?format(amount):'Amount unavailable';
  useEffect(()=>{
    if(!valid||!element.current||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let frame=0;const started=performance.now();
    function draw(now:number){const progress=Math.min(1,(now-started)/850);if(element.current)element.current.textContent=new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:2,maximumFractionDigits:2}).format(amount*(1-(1-progress)**3));if(progress<1)frame=requestAnimationFrame(draw);}
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[amount,valid]);
  return <strong className={s.tipAmount} aria-label={`Confirmed tip: ${final}`}><span ref={element} aria-hidden="true">{final}</span></strong>;
}
