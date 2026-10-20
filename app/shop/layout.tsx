import type { Metadata } from 'next';
import { CustomerShell } from '@/components/customer/customer-shell';
export const metadata:Metadata={title:'Good energy, delivered | MySureGas',description:'Browse cooking gas, cylinders and everyday essentials from your local MySureGas branch.'};
export default function Layout({children}:{children:React.ReactNode}){return <CustomerShell>{children}</CustomerShell>;}
