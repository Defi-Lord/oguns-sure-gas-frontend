import Image from 'next/image';
import styles from './branded-entrance.module.css';

export function BrandedEntrance({ inline = false }: { inline?: boolean } = {}) {
  return (
    <div className={inline ? styles.inlineEntrance : styles.entrance} aria-hidden="true">
      <div className={styles.entranceMark}>
        <Image src="/branding/mysuregas-mark.webp" alt="" width={inline ? 56 : 76} height={inline ? 56 : 76} preload={!inline} unoptimized />
      </div>
      <strong>MySureGas<span>GOOD ENERGY STARTS HERE</span></strong>
      <i />
    </div>
  );
}
