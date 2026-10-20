'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Flame, Loader2, Package, RefreshCw, RotateCcw, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api/client';
import { bagFingerprint, useCustomerCart, useCustomerClock } from '@/stores/customer-cart-store';
import { useAuthStore } from '@/stores/auth-store';
import type { PublicBranchListResponse, PublicBranch } from '@/types/branch';
import type { ProductListResponse } from '@/types/product';
import { buildReorderPlan, type PreviousItem, type ReorderRow } from './customer-reorder-plan';
import { formatMoney } from './customer-cart';
import s from './customer-reorder.module.css';
export function CustomerReorder({owner,orderNumber,branchId,items}:{owner:string;orderNumber:string;branchId:string;items:PreviousItem[]}){
 const dialog=useRef<HTMLDialogElement>(null),operation=useRef(0),busyRef=useRef(false);
 const cart=useCustomerCart(),now=useCustomerClock();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[branch,setBranch]=useState<PublicBranch|null>(null),[rows,setRows]=useState<ReorderRow[]|null>(null),[selected,setSelected]=useState<string[]>([]),[replace,setReplace]=useState(false),[done,setDone]=useState(false),[expected,setExpected]=useState('');
 const locked=cart.reserving||!!cart.checkouts[owner]||(cart.uncertain[owner]??0)>now;
 const chosen=rows?.filter(r=>r.line&&selected.includes(r.key))??[];
 const subtotal=chosen.reduce((sum,r)=>sum+r.line!.price*r.line!.quantity,0);
 function close(){operation.current++;busyRef.current=false;setBusy(false);dialog.current?.close();}
 async function load(){
  if(busyRef.current)return;
  const auth=useAuthStore.getState();if(auth.user?.id!==owner||auth.user.role!=='CUSTOMER'||auth.user.status!=='ACTIVE')return;
  const session=auth.sessionVersion,op=++operation.current;busyRef.current=true;setBusy(true);setError('');setRows(null);setBranch(null);setReplace(false);setDone(false);setExpected(bagFingerprint(useCustomerCart.getState()));
  dialog.current?.showModal();
  try{
   const [branches,products]=await Promise.all([api.get<PublicBranchListResponse>('/branches'),api.get<ProductListResponse>('/products',{params:{branchId}})]);
   const latest=useAuthStore.getState();if(operation.current!==op||latest.user?.id!==owner||latest.sessionVersion!==session)return;
   const active=branches.data.data.branches.find(b=>b.id===branchId&&b.isActive);
   if(!active){setError('This branch is not currently available. Choose another branch in the shop.');return;}
   const plan=buildReorderPlan(items,products.data.data.products,active.id);
   setBranch(active);setRows(plan);setSelected(plan.filter(r=>r.line).map(r=>r.key));
  }catch(cause){if(operation.current===op&&useAuthStore.getState().user?.id===owner&&useAuthStore.getState().sessionVersion===session)setError(getApiErrorMessage(cause));}
  finally{if(operation.current===op){busyRef.current=false;setBusy(false);}}
 }
 function apply(){
  const auth=useAuthStore.getState();if(done||busy||!branch||!chosen.length||auth.user?.id!==owner||auth.user.role!=='CUSTOMER'||auth.user.status!=='ACTIVE')return;
  if(cart.items.length&&!replace)return;
  const applied=useCustomerCart.getState().replaceFromOrder({id:branch.id,name:branch.name,city:branch.city},chosen.map(r=>r.line!),expected);
  if(!applied){setError('Your bag or checkout changed. Refresh this review before trying again.');setRows(null);setReplace(false);return;}
  setDone(true);setError('');
 }
 return <section className={s.panel}><div className={s.icon}><RotateCcw size={24}/></div><div className={s.copy}><span>YOUR EVERYDAY FAVOURITES</span><h2>Same essentials. A fresh start.</h2><p>Review these products again with today’s prices.</p></div><button className={s.primary} disabled={!cart.hydrated||locked} onClick={()=>void load()}>Buy again <ArrowRight size={16}/></button>{locked&&<p className={s.locked}>Finish your reserved checkout before starting another bag. <Link href="/shop/checkout">Resume checkout</Link></p>}
 <dialog ref={dialog} className={s.dialog} aria-labelledby="reorder-title" onCancel={close} onClick={e=>{if(e.target===e.currentTarget)close();}}><div className={s.dialogHeader}><span className={s.eyebrow}>A LITTLE LESS EFFORT</span><button aria-label="Close buy again" className={s.close} onClick={close}><X size={20}/></button><h2 id="reorder-title">Your favourites, again.</h2><p>From {orderNumber}{branch?` · ${branch.name}`:''}</p></div><div className={s.body}>
 {busy?<div className={s.loading} role="status"><Loader2 size={30} className={s.spin}/><h3>Checking today’s catalogue…</h3><p>Finding the current branch and product prices.</p></div>:done?<div className={s.success} role="status"><span><Check size={30}/></span><h3>Your bag is ready to review.</h3><p>{chosen.length} product{chosen.length===1?'':'s'} added from {branch?.name}. You can change quantities in your bag.</p><Link className={s.primary} href="/shop/cart" onClick={close}>Open your bag <ShoppingBag size={17}/></Link><button onClick={close}>Keep viewing this order</button></div>:<>
 {rows&&<><div className={s.assurance}><ShieldCheck size={18}/><p>Review before adding. Stock, delivery fees and your final total are confirmed at checkout. Gas refills need a fresh cylinder photo.</p></div><div className={s.rows}>{rows.map(row=><label key={row.key} className={s.row} data-unavailable={!row.line}><input type="checkbox" aria-label={`Include ${row.name}`} disabled={!row.line} checked={!!row.line&&selected.includes(row.key)} onChange={e=>setSelected(current=>e.target.checked?[...current,row.key]:current.filter(key=>key!==row.key))}/><span className={s.productIcon}>{row.line?.type==='GAS'?<Flame size={22}/>:<Package size={22}/>}</span><div><strong>{row.name}</strong>{row.line?<><small>{row.line.quantity} {row.line.unit} · {formatMoney(row.line.price)} per {row.line.unit}</small>{Number.isFinite(row.previousPrice)&&row.previousPrice!==row.line.price&&<small className={s.changed}>Previously {formatMoney(row.previousPrice)} per {row.line.unit}</small>}</>:<small className={s.unavailable}>{row.reason}</small>}</div>{row.line&&<strong className={s.lineTotal}>{formatMoney(row.line.price*row.line.quantity)}</strong>}</label>)}</div>
 {!chosen.length&&<p className={s.hint}>Select at least one listed product, or choose something new in the shop.</p>}
 {cart.items.length>0&&<label className={s.replace}><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/><span>Replace my current bag ({cart.items.length} product{cart.items.length===1?'':'s'}{cart.branch?` from ${cart.branch.name}`:''}) with the products selected above.</span></label>}
 <div className={s.total}><span>Estimated products subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p className={s.hint}>No payment is taken here. Previous discounts, fees, delivery details and cylinder photos are not copied.</p><button className={s.primary} disabled={!chosen.length||locked||(cart.items.length>0&&!replace)} onClick={apply}>{cart.items.length?'Replace bag with selected products':'Add selected products to bag'}<ArrowRight size={16}/></button>
 </>}
 {error&&<p role="alert" className={s.error}>{error}</p>}{!rows&&<button className={s.primary} onClick={()=>void load()}><RefreshCw size={16}/>Retry current prices</button>}<Link className={s.shop} href="/shop" onClick={close}>Explore the shop <ArrowRight size={15}/></Link>
 </>}
 </div></dialog></section>;
}
