import type { CartLine } from '@/stores/customer-cart-store';
import type { Product } from '@/types/product';
export type PreviousItem={id:string;productId?:string;productName?:string;quantity:number;unitPrice:number;product:{id?:string;name:string;type:string;unit:string}|null};
export type ReorderRow={key:string;name:string;previousPrice:number;line:CartLine|null;reason:string};
export function buildReorderPlan(items:PreviousItem[],products:Product[],branchId:string):ReorderRow[]{
 const seen=new Set<string>();
 return items.map(item=>{
  const id=item.productId??item.product?.id;
  const product=products.find(p=>p.id===id&&p.branchId===branchId&&p.isActive);
  const name=item.product?.name??item.productName??'Previous product';
  const base={key:item.id,name,previousPrice:item.unitPrice,line:null};
  if(!product)return {...base,reason:'No longer listed at this branch.'};
  if(seen.has(product.id))return {...base,reason:'This product appears more than once. Adjust its quantity in your bag.'};
  seen.add(product.id);
  if(!Number.isFinite(product.pricePerUnit)||product.pricePerUnit<0)return {...base,reason:'The current price is unavailable.'};
  if(product.type!==item.product?.type||product.unit!==item.product?.unit)return {...base,reason:'This product’s unit or type has changed. Choose it again from the shop.'};
  const qty=item.quantity;
  if(!Number.isFinite(qty)||qty<1||(product.type==='GAS'?Math.abs(qty*1000-Math.round(qty*1000))>=1e-7:!Number.isSafeInteger(qty)))return {...base,reason:'Choose a new quantity from the shop.'};
  return {key:item.id,name:product.name,previousPrice:item.unitPrice,reason:'',line:{id:product.id,name:product.name,type:product.type,unit:product.unit,price:product.pricePerUnit,quantity:qty}};
 });
}
