import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { paletteLabel, randomPalette } from '../../model/palettes'
import { useDoc } from '../../state/docContext'
import styles from './PaletteSwitcher.module.css'

export function PaletteSwitcher() {
  const { palette, setPalette } = useDoc()
  const dict = useDict()
  const label = paletteLabel(palette, useLang())

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setPalette(randomPalette(palette))}
      title={dict.editor.paletteTitle}
      aria-label={fill(dict.editor.paletteAria, { label })}
    >
      <span className={styles.ink} data-palette={palette} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <span className={styles.dice} aria-hidden="true">
        ⟳
      </span>
    </button>
  )
}
