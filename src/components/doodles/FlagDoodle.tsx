import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
  /** Залитый флажок — «жалоба уже отправлена», контур — «ещё нет». */
  filled?: boolean
  /** Своя толщина для мелкого размера — см. `Icon`, причина там же. */
  strokeWidth?: number
}

/**
 * «Флажок» из библиотеки рисунков — кнопка жалобы. Геометрия уехала в
 * `icons.generated.ts`, там же её берут наборы постера, и держать вторую копию
 * было бы верным способом их развести. В наборы сам этот доодл не входит: у
 * сайта рисунки свои и от набора постера не зависят.
 */
export function FlagDoodle({ size = 24, className, filled, strokeWidth }: DoodleProps) {
  return (
    <Icon name="flag" size={size} className={className} filled={filled} strokeWidth={strokeWidth} />
  )
}
