import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { paletteLabel, randomPalette } from '../../model/palettes'
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
  const dict = useDict()
  /*
   * Подпись темы — часть интерфейса, а не листа: тема не входит в бланк и на
   * бумаге не подписана. Поэтому язык здесь интерфейсный, в отличие от подписей
   * секций постера.
   */
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
