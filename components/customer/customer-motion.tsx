'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight, Droplets, Flame, Package, Sparkles } from 'lucide-react';
import type { Product } from '@/types/product';
import s from './customer.module.css';
const money=(value:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(value);

/** Illustrates categories, without advertising stock or fictional products. */
export function CustomerCategoryMotion(){
 return <section className={s.categoryMotion} aria-label="Product category showcase"><div className={s.motionHeading}><span><Sparkles size={15}/> Explore MySureGas</span></div><div className={s.categoryViewport} aria-hidden="true">{[{title:'Cooking gas',text:'Find your branch’s price per kg.',icon:Flame,tone:'gas'},{title:'Gas cylinders',text:'Explore cylinders at your branch.',icon:Package,tone:'cylinder'},{title:'Oils & essentials',text:'Engine oil, brake oil and more.',icon:Droplets,tone:'oil'}].map(({title,text,icon:Icon,tone},index)=><div className={s.categorySlide} key={title} data-tone={tone} style={{animationDelay:`${-index*4}s`}}><div className={s.categorySymbol}><Icon size={60} strokeWidth={1.2}/><span className={s.symbolOrbit}/></div><div><h2>{title}</h2><p>{text}</p><span className={s.categoryHint}>Choose a branch to browse <ArrowUpRight size={13}/></span></div></div>)}</div><div className={s.categoryProgress} aria-hidden="true">{[0,1,2].map(i=><span key={i} style={{animationDelay:`${-i*4}s`}}/>)}</div></section>;
}
function ShowcaseImage({product}:{product:Product}){
 const [broken,setBroken]=useState(false);const photo=product.images?.find(i=>i.isPrimary)??product.images?.[0];const Icon=product.type==='GAS'?Flame:product.type==='ENGINE_OIL'||product.type==='BRAKE_OIL'?Droplets:Package;
 return <div className={s.showcaseImage}>{photo&&!broken?<Image src={photo.url} alt="" width={160} height={160} unoptimized onError={()=>setBroken(true)}/>:<Icon size={39} strokeWidth={1.2} aria-hidden="true"/>}</div>;
}
export function CustomerProductShowcase({products,onView}:{products:Product[];onView:(product:Product)=>void}){
 const visible=products.slice(0,8);if(!visible.length)return null;const moving=visible.length>1;
 return <section className={s.showcase} aria-label="Product showcase" data-moving={moving?'true':'false'}><header><div><span className={s.showcaseDot}/><h3>Discover products at this branch</h3></div></header><div className={s.showcaseViewport}><div className={s.showcaseTrack}>{(moving?[0,1]:[0]).map(copy=><div className={s.showcaseGroup} key={copy} aria-hidden={copy===1?true:undefined}>{visible.map(product=><button key={`${copy}-${product.id}`} className={s.showcaseCard} onClick={()=>onView(product)} tabIndex={copy===1?-1:0} aria-label={`View featured ${product.name}`}><ShowcaseImage product={product}/><div><small>{product.category?.name??'MySureGas product'}</small><strong>{product.name}</strong><span>{money(product.pricePerUnit)} <small>/ {product.unit}</small></span></div><ArrowUpRight size={16} aria-hidden="true"/></button>)}</div>)}</div></div><p className={s.showcaseNote}>Tap a product to see details. The full product list is below.</p></section>;
}
