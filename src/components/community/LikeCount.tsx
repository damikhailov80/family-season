import { HeartDoodle } from '../doodles'
import styles from './LikeCount.module.css'

/** Своя толщина: общая 2.3 в рисунке размером с букву даёт серую паутину. */
const HEART_STROKE = 4

/**
 * Мест, где счёт показывают, три, и рисунок с отступом везде одни и те же —
 * держать их в трёх CSS-модулях значило бы три раза их разойтись. Размер и цвет,
 * наоборот, приходят снаружи.
 *
 * Имя для читалки приходит пропом: своего словаря компонент не заводит — его
 * рисует и серверная витрина, и клиентская панель, а `useDict()` серверному
 * компоненту недоступен.
 */
export function LikeCount({
  likes,
  size = 18,
  filled = true,
  /** Ноль скрывает только кнопка лайка: в своих числах автора ноль — данные. */
  hideZero = false,
  label,
  className,
}: {
  likes: number
  size?: number
  filled?: boolean
  hideZero?: boolean
  label: string
  className?: string
}) {
  return (
    <span
      className={className ? `${styles.likes} ${className}` : styles.likes}
      role="img"
      aria-label={label}
    >
      <HeartDoodle size={size} filled={filled} strokeWidth={HEART_STROKE} />
      {(likes > 0 || !hideZero) && likes}
    </span>
  )
}
