import { Suspense } from 'react';
import { CustomerOrders } from '@/components/customer/customer-orders';
export default function Page(){return <Suspense fallback={<p role="status">Loading your orders…</p>}><CustomerOrders/></Suspense>;}
