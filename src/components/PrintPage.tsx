import styles from './PrintPage.module.css'

/** Группа секций, занимающая одну страницу при печати. */
export function PrintPage({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>
}
