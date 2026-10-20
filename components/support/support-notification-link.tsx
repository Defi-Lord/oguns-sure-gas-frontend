import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { orderSupportNotificationHref } from './support-links';
export function SupportNotificationLink({data,portal}:{data:unknown;portal:'customer'|'staff'|'admin'}){
 const href=orderSupportNotificationHref(data,portal);
 return href?<Link className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100" href={href}>Open support conversation <ArrowUpRight size={14}/></Link>:null;
}
