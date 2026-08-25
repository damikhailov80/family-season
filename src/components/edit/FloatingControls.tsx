import { IconSetSwitcher } from './IconSetSwitcher'
import { PaletteSwitcher } from './PaletteSwitcher'
import styles from './FloatingControls.module.css'

/**
 * Плавающие переключатели оформления постера — тема и набор рисунков.
 *
 * Обе кнопки не зависят ни от одного из трёх состояний постера: ни тема, ни
 * рисунки в бланк не входят, их несут пометки `p=` и `i=`. Поэтому им нечего
 * делать в тулбаре среди кнопок, которые от состояния зависят, — они висят в
 * углу окна и остаются под рукой, пока постер прокручивают.
 *
 * Столбик, а не две отдельные `position: fixed`-кнопки: иначе их пришлось бы
 * разводить подобранными вручную `bottom`, и каждый такой отступ надо было бы
 * повторять во всех медиазапросах.
 */
export function FloatingControls() {
  return (
    <div className={styles.stack}>
      <IconSetSwitcher />
      <PaletteSwitcher />
    </div>
  )
}
