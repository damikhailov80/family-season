import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  filled?: boolean
  strokeWidth?: number
}

export function FlagDoodle({ size = 24, className, filled, strokeWidth }: DoodleProps) {
  return (
    <Icon name="flag" size={size} className={className} filled={filled} strokeWidth={strokeWidth} />
  )
}
