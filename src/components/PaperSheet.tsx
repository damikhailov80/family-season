import type { PaletteId } from '../types'
import styles from './PaperSheet.module.css'

export function PaperSheet({
  children,
  palette,
}: {
  children: React.ReactNode
  palette?: PaletteId
}) {
  return (
    <div className={styles.sheet} data-palette={palette}>
      {children}
    </div>
  )
}
