import { BrandedWorkspacePlaceholder } from '@/components/shared/branded-entrance';
import { Suspense } from 'react';
import { OrderSupportWorkspace } from '@/components/support/order-support';
export default function SupportPage(){return <Suspense fallback={<BrandedWorkspacePlaceholder label="Loading order support" />}><OrderSupportWorkspace portal="customer"/></Suspense>;}
