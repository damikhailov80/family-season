import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  /** Своя толщина для мелкого размера — см. `Icon`, причина там же. */
  strokeWidth?: number
}

/** Обёртка над `Icon`: геометрия живёт в одном месте — `icons.generated.ts`. */
export function MegaphoneDoodle({ size = 74, className, strokeWidth }: DoodleProps) {
  return <Icon name="megaphone" size={size} className={className} strokeWidth={strokeWidth} />
}
