import { BrandedWorkspacePlaceholder } from '@/components/shared/branded-entrance';
import { Suspense } from 'react';
import { CustomerOrders } from '@/components/customer/customer-orders';
export default function Page(){return <Suspense fallback={<BrandedWorkspacePlaceholder label="Loading your orders" />}><CustomerOrders/></Suspense>;}
