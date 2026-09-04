import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
}

/**
 * Однострочная обёртка над `Icon` с фиксированным именем: у сайта рисунки свои и
 * от набора постера не зависят, но геометрию нельзя держать в двух копиях.
 */
export function FamilyIcon({ size = 68, className }: DoodleProps) {
  return <Icon name="family-three" size={size} className={className} />
}
