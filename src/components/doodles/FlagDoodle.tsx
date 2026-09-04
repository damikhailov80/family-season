import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  /** Залитый флажок — «жалоба уже отправлена», контур — «ещё нет». */
  filled?: boolean
  /** Своя толщина для мелкого размера — см. `Icon`, причина там же. */
  strokeWidth?: number
}

/** Обёртка над `Icon`: геометрия живёт в одном месте — `icons.generated.ts`. */
export function FlagDoodle({ size = 24, className, filled, strokeWidth }: DoodleProps) {
  return (
    <Icon name="flag" size={size} className={className} filled={filled} strokeWidth={strokeWidth} />
  )
}
