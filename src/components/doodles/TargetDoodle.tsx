import { Icon } from './Icon'

interface DoodleProps {
  size?: number
  className?: string
}

/**
 * «Мишень» из библиотеки рисунков под старым именем. Геометрия уехала в
 * `icons.generated.ts` — там же её берут наборы постера, и держать вторую копию
 * было бы верным способом их развести. Постер зовёт рисунки через `PosterIcon`,
 * а это имя осталось для сайта: у лендинга, шапки и подвала рисунки свои и
 * от набора постера не зависят.
 */
export function TargetDoodle({ size = 64, className }: DoodleProps) {
  return <Icon name="target" size={size} className={className} />
}
