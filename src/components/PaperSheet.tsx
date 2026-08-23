import styles from './PaperSheet.module.css'

export function PaperSheet({ children }: { children: React.ReactNode }) {
  return <div className={styles.sheet}>{children}</div>
}
