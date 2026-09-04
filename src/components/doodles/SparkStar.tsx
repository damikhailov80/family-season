import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  filled?: boolean
}

export function SparkStar({ size = 24, className, filled }: DoodleProps) {
  return <Icon name="star" size={size} className={className} filled={filled} />
}
