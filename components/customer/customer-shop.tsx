'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Droplets, Flame, MapPin, Package, Search, Sparkles, Store } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import type { PublicBranch } from '@/types/branch';
import type { Product, ProductListResponse } from '@/types/product';
import s from './customer.module.css';
import { CustomerProductShowcase } from './customer-motion';
import { CustomerBranchSettings, useShoppingBranch } from './customer-branch';
import { CustomerProductSheet } from './customer-product-sheet';
import { CustomerShopHero } from './customer-shop-hero';
import h from './customer-home.module.css';
import m from './customer-app.module.css';
import { CustomerCampaignAnnouncement } from './customer-campaign-announcement';
const money=(value:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format(value);
export function CustomerShop(){
 const {branch, loading, error} = useShoppingBranch();
 const [category,setCategory]=useState('ALL');
 return <div className={h.home}><CustomerShopHero branch={branch} loading={loading} onCategory={setCategory}/>
 <CustomerCampaignAnnouncement/>
 <div id="guide" className={h.guide} aria-label="How ordering works"><span><Flame size={16}/> Choose your refill</span><i>→</i><span><Package size={16}/> Add your cylinder photo</span><i>→</i><span><MapPin size={16}/> Follow your delivery</span></div>
 {!branch&&!loading&&<CustomerBranchSettings initial/>}
 <section id="catalogue" className={s.catalogue}><header><div><span className={s.eyebrow}>THE EVERYDAY COLLECTION</span><h2>What do you need today?</h2></div>{branch&&<Link href="/shop/profile#my-branch" className={s.changeBranch}>My branch settings ↗</Link>}</header>{branch?<BranchCatalogue key={branch.id} branch={branch} type={category} onTypeChange={setCategory}/>:<div className={s.empty}><MapPin size={32}/><h3>{loading?'Getting your branch ready…':error?'Your branch couldn’t load.':'A little closer to home.'}</h3><p>{loading?'Your saved branch will appear here.':error?'Use Retry in the branch card above.':'Select a branch once to see its products and local prices.'}</p></div>}</section></div>;
}
function ProductVisual({product}:{product:Product}){const image=product.images?.find(i=>i.isPrimary)??product.images?.[0];const [failed,setFailed]=useState(false);const Icon=product.type==='GAS'?Flame:product.type==='ENGINE_OIL'||product.type==='BRAKE_OIL'?Droplets:Package;return <div className={`${s.productVisual} ${m.visual}`}>{image&&!failed?<Image src={image.url} alt={image.altText??product.name} width={480} height={480} unoptimized onError={()=>setFailed(true)}/>:['GAS','CYLINDER','ENGINE_OIL','BRAKE_OIL'].includes(product.type)?<div className={m.illustration} data-type={product.type} aria-hidden="true"/>:<Icon size={83} strokeWidth={1.1} aria-hidden="true"/>}<span>{product.type==='GAS'?'COOKING GAS':product.type==='CYLINDER'?'CYLINDERS':'EVERYDAY ESSENTIALS'}</span></div>;}
function BranchCatalogue({branch,type,onTypeChange:setType}:{branch:PublicBranch;type:string;onTypeChange:(type:string)=>void}){
 const [search,setSearch]=useState(''),[sort,setSort]=useState('name'),[selected,setSelected]=useState<Product|null>(null);
 const query=useQuery({queryKey:['customer','public-products',branch.id],queryFn:async({signal})=>(await api.get<ProductListResponse>('/products',{params:{branchId:branch.id},signal})).data.data.products.filter(p=>p.isActive&&p.branchId===branch.id),retry:false});
 const products=(query.data??[]).filter(p=>(type==='ALL'||p.type===type)&&`${p.name} ${p.description??''} ${p.category?.name??''}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>sort==='low'?a.pricePerUnit-b.pricePerUnit:sort==='high'?b.pricePerUnit-a.pricePerUnit:a.name.localeCompare(b.name));
 function open(product:Product){setSelected(product);}
 return <>{!query.isError&&query.isSuccess&&<div className={m.featured}><CustomerProductShowcase products={query.data??[]} onView={open}/></div>}<div className={`${s.filters} ${m.filters}`}><label className={s.search}><Search size={19}/><input aria-label="Search products" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for gas, cylinders or oils…"/></label><select aria-label="Sort products" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Name: A–Z</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div><div className={`${s.chips} ${m.categories}`} aria-label="Product categories">{[{id:'ALL',name:'All products',icon:Sparkles},{id:'GAS',name:'Cooking gas',icon:Flame},{id:'CYLINDER',name:'Cylinders',icon:Package},{id:'ENGINE_OIL',name:'Engine oil',icon:Droplets},{id:'BRAKE_OIL',name:'Brake oil',icon:Droplets},{id:'OTHER',name:'Other products',icon:Store}].map(({id,name,icon:Icon})=><button key={id} aria-pressed={type===id} onClick={()=>setType(id)}><Icon size={16}/>{name}</button>)}</div>
 {query.isPending?<div className={s.skeletonGrid} aria-label="Loading products" role="status">{[1,2,3].map(i=><div key={i}/>)}<span className="sr-only">Loading products…</span></div>:query.isError?<div className={s.empty} role="alert"><h3>Products couldn’t load.</h3><p>{getApiErrorMessage(query.error)}</p><button className={s.button} onClick={()=>void query.refetch()}>Retry products</button></div>:products.length===0?<div className={s.empty}><Package size={38}/><h3>{query.data?.length?'No matching products.':'No products at this branch yet.'}</h3><p>{query.data?.length?'Try a different search or choose “All products”.':'This branch has no active products to display.'}</p>{query.data?.length!==0&&<button className={s.button} onClick={()=>{setType('ALL');setSearch('');}}>Show all products</button>}</div>:<><p className={s.resultCount}>{products.length} product{products.length===1?'':'s'} · {branch.name}</p><div className={`${s.products} ${m.grid}`}>{products.map((product,index)=><button key={product.id} className={`${s.product} ${m.card}`} style={{animationDelay:`${Math.min(index,8)*70}ms`}} onClick={()=>open(product)} aria-label={`View ${product.name}`}><ProductVisual product={product}/><div className={`${s.productCopy} ${m.cardCopy}`}><small>{product.category?.name??'MySureGas products'}</small><h3>{product.name}</h3><div><span><strong>{money(product.pricePerUnit)}</strong><small>per {product.unit}</small></span><span className={`${s.productArrow} ${m.view}`}>View product <ArrowUpRight size={16}/></span></div></div></button>)}</div></>}
 {selected&&<CustomerProductSheet key={selected.id} product={selected} branch={branch} visual={<ProductVisual key={selected.id} product={selected}/>} onClose={()=>setSelected(null)}/>}</>;
}
