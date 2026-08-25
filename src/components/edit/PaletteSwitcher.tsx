import { PALETTE_LABELS, randomPalette } from '../../model/palettes'
import { useDoc } from '../../state/docContext'
import styles from './PaletteSwitcher.module.css'

/**
 * Выбор темы постера. Тем сто, поэтому списка нет: кнопка бросает постер в
 * случайную другую тему, а название и четыре краски текущей видно прямо на ней.
 * Слова «Тема:» на кнопке нет: образец слева и ⟳ справа говорят это и без него,
 * а место нужно самому названию — иначе длинные пришлось бы обрезать.
 *
 * Кнопка есть во всех трёх состояниях постера, включая пример: тема в бланк не
 * входит, её несёт пометка `p=` рядом с блобом, а `p=` и так сильнее темы из файла
 * примера. Поэтому смена темы примера — не правка, а всего лишь запись в адрес. И
 * поэтому же кнопка не в тулбаре, а плавающая: ни от одного состояния она не зависит.
 * `data-palette` висит на кружке-образце внутри кнопки, а не на самой
 * кнопке: краски показывает образец, а рамка и подпись остаются цветами сайта.
 */
export function PaletteSwitcher() {
  const { palette, setPalette } = useDoc()

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setPalette(randomPalette(palette))}
      title="Другая тема постера — случайная из ста"
      aria-label={`Тема постера: ${PALETTE_LABELS[palette]}. Сменить на случайную`}
    >
      <span className={styles.ink} data-palette={palette} aria-hidden="true" />
      <span className={styles.label}>{PALETTE_LABELS[palette]}</span>
      <span className={styles.dice} aria-hidden="true">
        ⟳
      </span>
    </button>
  )
}
