import Image from 'next/image';
import styles from './branded-entrance.module.css';

export function BrandedEntrance() {
  return (
    <div className={styles.entrance} aria-hidden="true">
      <div className={styles.entranceMark}>
        <Image src="/branding/mysuregas-mark.webp" alt="" width={76} height={76} preload unoptimized />
      </div>
      <strong>MySureGas<span>GOOD ENERGY STARTS HERE</span></strong>
      <i />
    </div>
  );
}
