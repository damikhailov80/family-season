import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
}

export function FamilyIcon({ size = 68, className }: DoodleProps) {
  return <Icon name="family-three" size={size} className={className} />
}
