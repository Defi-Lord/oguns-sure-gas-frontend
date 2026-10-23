'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Flame, MapPin, Package, ShieldCheck, Sparkles, Truck, Gift } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { CustomerBranchSettings, useShoppingBranch } from './customer-branch';
import s from './customer-experience.module.css';
export function CustomerEntrance() {
  return <div className={s.entrance} aria-hidden="true"><div className={s.entranceMark}><Image src="/branding/ogun-sure-gas-mark.png" alt="" width={76} height={76} priority unoptimized/></div><strong>MySureGas<span>GOOD ENERGY STARTS HERE</span></strong><i/></div>;
}
const steps = [ { icon: MapPin, title: 'Your branch, remembered', detail: 'Choose once. Feel local every time.' }, { icon: Flame, title: 'Refill your everyday', detail: 'Gas, cylinders and essentials in one place.' }, { icon: Truck, title: 'Follow your order', detail: 'Stay close to every delivery update.' }, { icon: Gift, title: 'A little extra good', detail: 'Explore giveaways and your awarded rewards.' } ];
export function CustomerWelcomeRibbon() {
  return <section className={s.ribbon} id="guide" aria-label="How MySureGas works"><span className={s.ribbonLabel}><Sparkles size={15}/> THE LITTLE THINGS</span><div className={s.ribbonWindow}><div className={s.ribbonTrack}>{[0,1].map(copy => <div className={s.ribbonGroup} key={copy} aria-hidden={copy === 1}>{steps.map(({ icon: Icon, title, detail }) => <div className={s.ribbonItem} key={title}><span><Icon size={18}/></span><div><strong>{title}</strong><small>{detail}</small></div><i>✳</i></div>)}</div>)}</div></div></section>;
}
function EnergyScene() {
  return <div className={s.energyScene} aria-hidden="true"><div className={s.sceneOrbit}/><div className={s.sceneOrbitTwo}/><div className={s.sceneHalo}/><div className={s.sceneCore}><Image src="/branding/ogun-sure-gas-mark.png" alt="" width={122} height={122} loading="eager" unoptimized/><span>GOOD ENERGY</span></div><div className={s.floatTag}><MapPin size={17}/><span>Your neighbourhood.<strong>A little more connected.</strong></span></div><div className={s.floatTagTwo}><Package size={17}/><span>Everyday essentials<strong>One familiar place.</strong></span></div><span className={s.sceneSpark}>✳</span></div>;
}
export function CustomerLanding() {
  const { user, hasHydrated } = useAuthStore();
  const customer = hasHydrated && user?.role === 'CUSTOMER' && user.status === 'ACTIVE';
  return <div className={s.landing}><header className={s.landingHeader}><Link href="/" className={s.logo}><span><Flame size={23}/></span>MySureGas</Link><nav aria-label="Welcome navigation"><a href="#how-it-feels">Why MySureGas</a><Link href="/shop">Explore the shop <ArrowUpRight size={14}/></Link></nav><Link className={s.secondary} href={customer ? '/shop' : '/shop/login'}>{customer ? 'My shop' : 'Sign in'}<ArrowRight size={15}/></Link></header>
    <main><section className={s.landingHero}><div className={s.landingCopy}><span className={s.smallLabel}><span className={s.liveDot}/> WELCOME TO YOUR EVERYDAY</span><h1>Home feels better<br/>with <em>good energy.</em></h1><p>A kitchen ready for your next recipe. Essentials for the day ahead. Your local MySureGas branch, a little closer.</p><div className={s.heroActions}><Link href={customer ? '/shop/welcome' : '/shop/register'} className={s.primary}>{customer ? 'Welcome back' : 'Make yourself at home'}<ArrowUpRight size={19}/></Link><Link href="/shop" className={s.textLink}>Just looking? Explore <ArrowRight size={16}/></Link></div><span className={s.heroFootnote}><ShieldCheck size={15}/> Browse freely. Choose your branch. Order when you’re ready.</span></div><EnergyScene/></section>
      <CustomerWelcomeRibbon/>
      <section className={s.storySection} id="how-it-feels"><div className={s.storyHeading}><span className={s.smallLabel}>LESS FRICTION. MORE LIVING.</span><h2>Your everyday,<br/><em>beautifully connected.</em></h2><p>From your first refill to your next little win, everything has its own place.</p></div><div className={s.storyCards}>{steps.slice(0,3).map(({ icon: Icon, title, detail }, index) => <article key={title}><span className={s.storyNumber}>0{index+1}</span><div className={s.storyIcon}><Icon size={29}/></div><h3>{title}</h3><p>{detail}</p><Link href="/shop">Take a look <ArrowUpRight size={15}/></Link></article>)}</div></section>
      <section className={s.finalInvite}><Sparkles size={27}/><span className={s.smallLabel}>THERE’S A PLACE FOR YOU HERE</span><h2>Let’s bring good<br/>energy home.</h2><Link href="/shop" className={s.primary}>Find your everyday <ArrowUpRight size={19}/></Link><span className={s.inviteHalo}/></section></main>
    <footer className={s.landingFooter}><Link href="/" className={s.logo}><Flame size={20}/>MySureGas</Link><p>Your local essentials. A brighter everyday.</p><Link href="/shop">Explore MySureGas <ArrowUpRight size={14}/></Link></footer></div>;
}
export function CustomerArrival() {
  const { user, hasHydrated } = useAuthStore(), { branch, loading } = useShoppingBranch();
  if (!hasHydrated) return <div className={s.arrival} role="status">Getting your space ready…</div>;
  if (user?.role !== 'CUSTOMER' || user.status !== 'ACTIVE') return <section className={s.arrival}><Sparkles size={32}/><h1>Your good energy starts here.</h1><p>Sign in to make this space yours.</p><Link href="/shop/login" className={s.primary}>Sign in <ArrowRight size={17}/></Link></section>;
  return <section className={s.arrival}><span className={s.arrivalOrb}><Flame size={49}/></span><span className={s.smallLabel}>YOUR MYSUREGAS SPACE</span><h1>Good to have you here,<br/><em>{user.firstName}.</em></h1><p>{branch ? `${branch.name} is ready for your next everyday essential.` : 'Let’s make your next refill feel effortless. Start by saving your local branch.'}</p>{!branch && !loading && <CustomerBranchSettings initial/>}<div className={s.arrivalActions}><Link href="/shop" className={s.primary}>Enter your shop <ArrowRight size={18}/></Link><Link href="/shop/orders" className={s.secondary}>View my orders <Package size={17}/></Link></div></section>;
}
