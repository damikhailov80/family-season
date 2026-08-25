import { Icon } from '../doodles/Icon'
import { ICON_SET_ICONS, ICON_SET_LABELS, randomIconSet } from '../../model/icons'
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

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setIconSet(randomIconSet(iconSet))}
      title="Другие рисунки постера — случайный набор из двадцати"
      aria-label={`Рисунки постера: ${ICON_SET_LABELS[iconSet]}. Сменить на случайные`}
    >
      <span className={styles.sample} aria-hidden="true">
        {SAMPLE.map((slot) => (
          <Icon key={slot} name={icons[slot]} size={17} />
        ))}
      </span>
      <span className={styles.label}>{ICON_SET_LABELS[iconSet]}</span>
      <span className={styles.dice} aria-hidden="true">
        ⟳
      </span>
    </button>
  )
}
