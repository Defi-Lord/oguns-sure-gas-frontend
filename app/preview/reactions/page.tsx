import type { Metadata } from 'next';
import { MomentPreview } from '@/components/experience/moment-preview';
export const metadata: Metadata = { title: 'MySureGas · Motion Preview', robots: { index: false, follow: false } };
export default function ReactionsPage(){return <MomentPreview/>;}
