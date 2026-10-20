'use client';
import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import type { ProductType } from '@/types/product';
export interface CartBranch { id: string; name: string; city: string; }
export interface CartLine { id: string; name: string; type: ProductType; unit: string; price: number; quantity: number; }
interface CartState {
 branch: CartBranch | null; items: CartLine[]; hydrated: boolean; reserving:boolean; setReserving:(value:boolean)=>void;
 checkouts: Record<string,string>; uncertain: Record<string,number>; paymentLinks: Record<string,{checkoutId:string;url:string}>;
 setHydrated: () => void;
 add: (branch: CartBranch, line: CartLine, replace?: boolean) => void;
 quantity: (id: string, quantity: number) => void; remove: (id: string) => void;
 replaceFromOrder: (branch: CartBranch, lines: CartLine[], expectedBag: string) => boolean;
 clearBag: () => void; rememberCheckout: (owner: string, id: string) => void;
 rememberPayment: (owner:string,checkoutId:string,url:string) => void;
 forgetCheckout: (owner: string, paid?: boolean) => void; markUncertain: (owner: string) => void;
}
export const validQuantity = (type: ProductType, value: number) => Number.isFinite(value) && value >= 1 && (type === 'GAS' ? Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-7 : Number.isSafeInteger(value));
export function useCustomerClock(){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(timer);},[]);return now;}
export function bagFingerprint(state:Pick<CartState,'branch'|'items'>){return JSON.stringify({branch:state.branch,items:state.items});}
function locked(state: CartState) { const user=useAuthStore.getState().user; return state.reserving || Boolean(user && (state.checkouts[user.id] || (state.uncertain[user.id] ?? 0) > Date.now())); }
export const useCustomerCart = create<CartState>()(persist((set) => ({
 branch: null, items: [], hydrated: false, reserving:false, setReserving:value=>set({reserving:value}), checkouts: {}, uncertain: {}, paymentLinks: {},
 setHydrated: () => set({ hydrated: true }),
 add: (branch,line,replace=false) => set(state => {
  if(locked(state) || !validQuantity(line.type,line.quantity) || !Number.isFinite(line.price) || line.price < 0) return state;
  if(state.branch && state.branch.id !== branch.id && !replace) return state;
  const items=replace?[]:state.items, existing=items.find(i=>i.id===line.id);
  const quantity = (existing?.quantity ?? 0) + line.quantity;
  if (!validQuantity(line.type,quantity)) return state;
  return {branch, items:existing ? items.map(i=>i.id===line.id?{...line,quantity}:i) : [...items,line]};
 }),
 quantity: (id,quantity) => set(state=>locked(state)?state:{items:state.items.map(i=>i.id===id&&validQuantity(i.type,quantity)?{...i,quantity}:i)}),
 remove: id => set(state=> {if(locked(state))return state;const items=state.items.filter(i=>i.id!==id);return {items,branch:items.length?state.branch:null};}),
 replaceFromOrder: (branch,lines,expectedBag) => {
  let applied=false;
  set(state=>{
   if(!state.hydrated||locked(state)||bagFingerprint(state)!==expectedBag||!branch.id||!lines.length||new Set(lines.map(i=>i.id)).size!==lines.length||lines.some(i=>!i.id||!validQuantity(i.type,i.quantity)||!Number.isFinite(i.price)||i.price<0))return state;
   applied=true;return {branch:{...branch},items:lines.map(i=>({...i}))};
  });
  return applied;
 },
 clearBag: () => set({items:[],branch:null}),
 rememberCheckout: (owner,id) => set(state=>({checkouts:{...state.checkouts,[owner]:id},uncertain:{...state.uncertain,[owner]:0}})),
 rememberPayment: (owner,checkoutId,url)=>set(state=>({paymentLinks:{...state.paymentLinks,[owner]:{checkoutId,url}}})),
 forgetCheckout: (owner,paid=false) => set(state=>{const checkouts={...state.checkouts},paymentLinks={...state.paymentLinks};delete checkouts[owner];delete paymentLinks[owner];return {checkouts,paymentLinks,...(paid?{items:[],branch:null}:{})};}),
 markUncertain: owner => set(state=>({uncertain:{...state.uncertain,[owner]:Date.now()+30*60*1000}})),
}),{name:'mysuregas-customer-bag-v1',storage:createJSONStorage(()=>sessionStorage),partialize:({branch,items,checkouts,uncertain,paymentLinks})=>({branch,items,checkouts,uncertain,paymentLinks}),onRehydrateStorage:()=>state=>state?.setHydrated()}));
