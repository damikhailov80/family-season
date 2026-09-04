import { IconSetSwitcher } from './IconSetSwitcher'
import { PaletteSwitcher } from './PaletteSwitcher'
import styles from './FloatingControls.module.css'

/**
 * Обе кнопки не зависят ни от одного из трёх состояний постера, поэтому им нечего
 * делать в тулбаре: они висят в углу окна и остаются под рукой при прокрутке.
 *
 * Столбик, а не две отдельные `position: fixed`-кнопки: иначе их пришлось бы
 * разводить подобранными вручную `bottom` и повторять их в каждом медиазапросе.
 */
export function FloatingControls() {
  return (
    <div className={styles.stack}>
      <IconSetSwitcher />
      <PaletteSwitcher />
    </div>
  )
}
