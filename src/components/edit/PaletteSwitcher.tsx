import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { paletteLabel, randomPalette } from '../../model/palettes'
import { useDoc } from '../../state/docContext'
import styles from './PaletteSwitcher.module.css'

/**
 * Тем сто, поэтому списка нет: кнопка бросает постер в случайную другую тему.
 * Плавающая, а не в тулбаре: ни от одного состояния постера она не зависит.
 *
 * `data-palette` висит на кружке-образце внутри кнопки, а не на самой кнопке:
 * краски показывает образец, а рамка и подпись остаются цветами сайта.
 */
export function PaletteSwitcher() {
  const { palette, setPalette } = useDoc()
  const dict = useDict()
  // Подпись темы — интерфейс, а не лист: на бумаге тема не подписана.
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
