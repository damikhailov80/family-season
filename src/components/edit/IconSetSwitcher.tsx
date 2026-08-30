import { Icon } from '../doodles/Icon'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { ICON_SET_ICONS, iconSetLabel, randomIconSet } from '../../model/icons'
import { useDoc } from '../../state/docContext'
import styles from './IconSetSwitcher.module.css'

/** Три слота из восьми — на образец: крупный знак шапки, звёздочка и цель. */
const SAMPLE = ['mark', 'spark', 'goal'] as const

/**
 * Выбор набора рисунков постера. Устроен как выбор темы и по тем же причинам:
 * наборов двадцать, поэтому списка нет — кнопка бросает постер в случайный
 * другой набор, а какой набор сейчас, видно по трём рисункам на самой кнопке.
 *
 * Кнопка есть во всех трёх состояниях постера, включая пример: набор в бланк не
 * входит, его несёт пометка `i=`, а `i=` и так сильнее набора из файла примера.
 * Поэтому смена рисунков примера — не правка, а всего лишь запись в адрес.
 *
 * Образец рисуется `Icon`, а не `PosterIcon`: кнопка живёт вне постера, набор из
 * контекста ей брать неоткуда, да и не нужно — она сама его и показывает.
 * Красится он цветами сайта: рисунки показывает форма, а не краска темы.
 */
export function IconSetSwitcher() {
  const { iconSet, setIconSet } = useDoc()
  const icons = ICON_SET_ICONS[iconSet]
  const dict = useDict()
  // Подпись набора — интерфейс, как и подпись темы: см. `PaletteSwitcher`.
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
