import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
}

/** Обёртка над `Icon`: геометрия живёт в одном месте — `icons.generated.ts`. */
export function TargetDoodle({ size = 64, className }: DoodleProps) {
  return <Icon name="target" size={size} className={className} />
}
