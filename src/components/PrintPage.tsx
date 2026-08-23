import styles from './PrintPage.module.css'

/**
 * Группа секций, занимающая одну страницу при печати.
 * Лист устроен как две такие страницы по две нумерованные секции в каждой.
 */
export function PrintPage({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>
}
