import { Flame } from 'lucide-react';
import s from './rider.module.css';
export function RiderBrand(){return <span className={s.brand}><Flame size={25} strokeWidth={1.8} aria-hidden="true"/>MySureGas<span className="sr-only"> rider workspace</span></span>;}
