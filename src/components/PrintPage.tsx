import styles from './PrintPage.module.css'

export function PrintPage({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>
}
