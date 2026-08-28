import { ICONS, ICON_STROKE, ICON_VIEWBOX } from './icons.generated'
import type { IconName, IconShape } from './icons.generated'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  /**
   * Перебивает заливку рисунка. Нужен там, где одна и та же форма показывает два
   * состояния — залитая звезда «в избранном» и её же контур «ещё нет». Заводить
   * ради этого второй рисунок нельзя: геометрия в проекте живёт в одном месте.
   */
  filled?: boolean
  /**
   * Перебивает толщину обводки — по той же причине, что и `filled`, и только
   * ради мелкого размера. Рисунок в 18 px на кнопке тулбара при общей обводке
   * 2.3 на сетке в 64 единицы даёт 0,65 экранного пикселя, то есть серую
   * паутину (та же беда, что у слота `spark`). Заводить ради кнопки второй
   * рисунок нельзя: геометрия в проекте живёт в одном месте.
   */
  strokeWidth?: number
}

/**
 * Рисунок из библиотеки. Все сорок лежат на одной квадратной сетке, поэтому
 * размер задаёт место в макете, а не сам рисунок: подстановка другого рисунка
 * в тот же слот вёрстку не двигает — ради этого сетка и общая.
 *
 * Цвет — только `currentColor`, как у доодлов: краску даёт `color` у класса
 * снаружи, поэтому рисунок сам собой попадает в тему постера.
 */
export function Icon({ name, size = 48, className, filled, strokeWidth }: IconProps) {
  const shape: IconShape = ICONS[name]

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      fill={(filled ?? shape.fill) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth ?? shape.stroke ?? ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape.circles?.map(([cx, cy, r]) => (
        <circle key={`${cx} ${cy} ${r}`} cx={cx} cy={cy} r={r} />
      ))}
      {shape.paths?.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
