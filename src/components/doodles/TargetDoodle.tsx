import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
}

export function TargetDoodle({ size = 64, className }: DoodleProps) {
  return <Icon name="target" size={size} className={className} />
}
