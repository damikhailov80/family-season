import type { PaletteId } from '../types'
import styles from './PaperSheet.module.css'

/**
 * `palette` вешает тему на сам постер, а не на страницу: сайт вокруг него своих
 * цветов не меняет. Лендинг рисуется тем же компонентом и темы не получает.
 */
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
