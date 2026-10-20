import styles from './developer-credit.module.css';

/** Shared development signature; rendered once by the root layout. */
export function DeveloperCredit() {
  return (
    <footer className={styles.footer} aria-label="Development credit">
      <div className={styles.signature}>
        <span className={styles.monogram} aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none"><path d="M9 24V8l14 16V8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 28h16" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className={styles.spark}/>
        </span>
        <span className={styles.copy}><span className={styles.label}>Built by</span><span className={styles.name}>Nazzitech<span className={styles.dot} aria-hidden="true"/></span></span>
        <span className={styles.divider} aria-hidden="true"/>
        <span className={styles.note}>Thoughtfully crafted.<br/><span>Beautifully connected.</span></span>
        <svg className={styles.star} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z" stroke="currentColor" strokeWidth="1.3"/></svg>
      </div>
    </footer>
  );
}
