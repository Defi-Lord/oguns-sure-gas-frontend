import { CustomerAccountEmail } from '@/components/customer/customer-account-email';
export const metadata = {title:'Account security | MySureGas',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Page(){return <CustomerAccountEmail mode='forgot'/>;}
