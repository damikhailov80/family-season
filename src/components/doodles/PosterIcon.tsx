import { ICON_SET_ICONS } from '../../model/icons'
import type { IconSlot } from '../../model/icons'
import { Icon } from './Icon'
import { useIconSet } from './iconSetContext'

interface PosterIconProps {
  slot: IconSlot
  size?: number
  className?: string
}

export function PosterIcon({ slot, size, className }: PosterIconProps) {
  return <Icon name={ICON_SET_ICONS[useIconSet()][slot]} size={size} className={className} />
}
