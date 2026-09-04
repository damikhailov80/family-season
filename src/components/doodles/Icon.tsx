import { ICONS, ICON_STROKE, ICON_VIEWBOX } from './icons.generated'
import type { IconName, IconShape } from './icons.generated'

interface IconProps {
  name: IconName
  size?: number
  className?: string
  filled?: boolean
  strokeWidth?: number
}

export function Icon({ name, size = 48, className, filled, strokeWidth }: IconProps) {
  const shape: IconShape = ICONS[name]

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      fill={(filled ?? shape.fill) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth ?? shape.stroke ?? ICON_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape.circles?.map(([cx, cy, r]) => (
        <circle key={`${cx} ${cy} ${r}`} cx={cx} cy={cy} r={r} />
      ))}
      {shape.paths?.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
