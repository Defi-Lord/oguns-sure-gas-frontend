import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { PublicBranch } from '@/types/branch';
import s from './customer-home.module.css';

const categories=[{type:'GAS',label:'Gas refills',image:'gas'},{type:'CYLINDER',label:'Cylinders',image:'cylinder'},{type:'ENGINE_OIL',label:'Engine oil',image:'engine'},{type:'BRAKE_OIL',label:'Brake oil',image:'brake'}];
export function CustomerShopHero({ branch, loading, onCategory }: { branch: PublicBranch | undefined; loading: boolean; onCategory:(type:string)=>void }) {
  function choose(type:string){onCategory(type);document.getElementById(branch?'catalogue':'branches')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  return <>
    {branch && <Link className={s.branch} href="/shop/profile#my-branch"><span><MapPin size={15}/>{branch.name}</span><small>Change in profile <ArrowRight size={13}/></small></Link>}
    <section className={s.hero} aria-label="Explore MySureGas">
      <div className={s.copy}>
        <span className={s.eyebrow}><span/> EXPLORE MYSUREGAS</span>
        <h1>Good energy.<br/><em>Delivered.</em></h1>
        <p>Refill your gas and shop everyday essentials.{branch && <> Fresh from your local {branch.name}.</>}</p>
        <div className={s.actions}><a href={branch ? '#catalogue' : '#branches'} className={s.primary}>{branch ? 'Shop your branch' : loading ? 'Explore the shop' : 'Choose your branch'}<ArrowRight size={18}/></a><a className={s.secondary} href="#catalogue">Browse essentials</a></div>
        <span className={s.note}>Your local essentials. A brighter everyday.</span>
      </div>
      <div className={s.scene}>
        <Image className={s.cylinder} src="/images/customer/good-energy-hero.webp" alt="Green cooking gas cylinder on a softly lit lime pedestal" width={960} height={960} priority sizes="(max-width: 650px) 88vw, 46vw"/>
        <span className={s.halo} aria-hidden="true"/><span className={s.orbit} aria-hidden="true"/>
        <div className={s.productOrbit} aria-label="Explore product categories">
          {categories.map(({type,label,image},index)=><div className={s.satellite} key={type} style={{animationDelay:`${-index*6}s`}}><button type="button" onClick={()=>choose(type)} aria-label={`Explore ${label}`}><span className={`${s.miniature} ${s[image]}`} aria-hidden="true"/><span>{label}<ArrowRight size={12}/></span></button></div>)}
        </div>
      </div>
    </section>
  </>;
}
