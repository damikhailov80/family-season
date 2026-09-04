import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  /** Залитое сердце — «лайк поставлен», контур — «ещё нет». */
  filled?: boolean
  /** Своя толщина для мелкого размера — см. `Icon`, причина там же. */
  strokeWidth?: number
}

/** Обёртка над `Icon`: геометрия живёт в одном месте — `icons.generated.ts`. */
export function HeartDoodle({ size = 48, className, filled, strokeWidth }: DoodleProps) {
  return (
    <Icon
      name="heart"
      size={size}
      className={className}
      filled={filled}
      strokeWidth={strokeWidth}
    />
  )
}
