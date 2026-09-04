import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  filled?: boolean
  strokeWidth?: number
}

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
