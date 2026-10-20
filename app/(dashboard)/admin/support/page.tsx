import { Suspense } from 'react';
import { OrderSupportWorkspace } from '@/components/support/order-support';
export default function SupportPage(){return <Suspense fallback={<p>Loading order support…</p>}><OrderSupportWorkspace portal="admin"/></Suspense>;}
