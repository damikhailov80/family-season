import { unfavoriteEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Убрать отложенное из кабинета.
 *
 * Серверный компонент, в отличие от соседей по строке: подтверждать здесь нечего —
 * сам сезон никуда не денется, он чужой и лежит на витрине. Значит, не нужно ни
 * окна, ни клиента: обычная форма с серверным действием работает и без JS.
 */
export function UnfavoriteEntry({
  code,
  title,
  back,
}: {
  code: string
  title: string
  back: string
}) {
  return (
    <form action={unfavoriteEntry.bind(null, code, back)}>
      <button
        type="submit"
        className={styles.rowButton}
        title={`Убрать «${title}» из избранного`}
        aria-label={`Убрать «${title}» из избранного`}
      >
        ×
      </button>
    </form>
  )
}
