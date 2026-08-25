import { PALETTE_LABELS, PALETTE_ORDER } from '../../model/palettes'
import { useDoc } from '../../state/docContext'
import styles from './PaletteSwitcher.module.css'

/**
 * Выбор темы. Тема — часть бланка, поэтому переключатель живёт только в правке:
 * пример не правится, его тему задаёт файл примера.
 *
 * `data-palette` висит на кружке внутри кнопки, а не на самой кнопке: краски
 * своей темы показывает только образец, а обводка и кольцо выбора остаются
 * цветами сайта. Отдельного CSS на каждый набор не нужно.
 */
export function PaletteSwitcher() {
  const { palette: current, setPalette } = useDoc()

  return (
    <div className={styles.group} role="group" aria-label="Тема постера">
      {PALETTE_ORDER.map((palette) => (
        <button
          key={palette}
          type="button"
          className={styles.swatch}
          aria-label={PALETTE_LABELS[palette]}
          aria-pressed={current === palette}
          title={PALETTE_LABELS[palette]}
          onClick={() => setPalette(palette)}
        >
          <span className={styles.ink} data-palette={palette} />
        </button>
      ))}
    </div>
  )
}
