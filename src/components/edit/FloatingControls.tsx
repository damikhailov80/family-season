import { IconSetSwitcher } from './IconSetSwitcher'
import { PaletteSwitcher } from './PaletteSwitcher'
import styles from './FloatingControls.module.css'

export function FloatingControls() {
  return (
    <div className={styles.stack}>
      <IconSetSwitcher />
      <PaletteSwitcher />
    </div>
  )
}
