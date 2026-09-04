import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  strokeWidth?: number
}

export function MegaphoneDoodle({ size = 74, className, strokeWidth }: DoodleProps) {
  return <Icon name="megaphone" size={size} className={className} strokeWidth={strokeWidth} />
}
