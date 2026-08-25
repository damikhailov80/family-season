import { ICON_SET_ICONS } from '../../model/icons'
import type { IconSlot } from '../../model/icons'
import { Icon } from './Icon'
import { useIconSet } from './iconSetContext'

interface PosterIconProps {
  /** Место в макете, а не имя рисунка: какой рисунок сюда встанет — решает набор. */
  slot: IconSlot
  size?: number
  className?: string
}

/**
 * Рисунок постера. Секции просят слот, набор подставляет в него рисунок —
 * поэтому переключение набора не трогает ни вёрстку, ни сами секции.
 *
 * Импортировать его из `doodles/index.ts` нельзя: там барель для сайта, а этот
 * компонент читает контекст и годится только внутри постера.
 */
export function PosterIcon({ slot, size, className }: PosterIconProps) {
  return <Icon name={ICON_SET_ICONS[useIconSet()][slot]} size={size} className={className} />
}
