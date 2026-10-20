import { Flame, Leaf, ShieldCheck } from 'lucide-react';
import styles from './staff-design.module.css';

export function StaffBrand() {
  return <span className={styles.brand}><span className={styles.brandMark}><Flame size={25} strokeWidth={1.8} aria-hidden="true" /></span>MySureGas<span className="sr-only"> staff workspace</span></span>;
}

export function StaffEnergyArt() {
  return <div className={styles.art} aria-hidden="true"><div className={styles.orbit} /><div className={`${styles.orbit} ${styles.orbitTwo}`} /><div className={styles.cylinder}><Flame size={43} strokeWidth={1.2} /></div><span className={styles.artBadge}><Leaf size={23} strokeWidth={1.5} /></span><span className={styles.artBadge}><ShieldCheck size={23} strokeWidth={1.5} /></span></div>;
}
