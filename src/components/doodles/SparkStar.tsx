import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  /** Залитая звезда или её контур — два состояния кнопки «В избранное». */
  filled?: boolean
}

/** Обёртка над `Icon`: геометрия живёт в одном месте — `icons.generated.ts`. */
export function SparkStar({ size = 24, className, filled }: DoodleProps) {
  return <Icon name="star" size={size} className={className} filled={filled} />
}
