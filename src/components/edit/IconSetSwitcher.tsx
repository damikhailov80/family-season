import { Icon } from '../doodles/Icon'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { ICON_SET_ICONS, iconSetLabel, randomIconSet } from '../../model/icons'
import { useDoc } from '../../state/docContext'
import styles from './IconSetSwitcher.module.css'

const SAMPLE = ['mark', 'spark', 'goal'] as const

export function IconSetSwitcher() {
  const { iconSet, setIconSet } = useDoc()
  const icons = ICON_SET_ICONS[iconSet]
  const dict = useDict()
  const label = iconSetLabel(iconSet, useLang())

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setIconSet(randomIconSet(iconSet))}
      title={dict.editor.iconsTitle}
      aria-label={fill(dict.editor.iconsAria, { label })}
    >
      <span className={styles.sample} aria-hidden="true">
        {SAMPLE.map((slot) => (
          <Icon key={slot} name={icons[slot]} size={17} />
        ))}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.dice} aria-hidden="true">
        ⟳
      </span>
    </button>
  )
}
