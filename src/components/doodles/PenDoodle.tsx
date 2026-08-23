interface DoodleProps {
  size?: number
  className?: string
}

export function PenDoodle({ size = 56, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Ручка под наклоном: колпачок, корпус, перо */}
      <path d="M42 6l8 8-26 26-11 3 3-11Z" />
      <path d="M36 12l8 8" />
      <path d="M13 43l4-4" />
      {/* Росчерк на строке */}
      <path d="M8 50c5-4 9 2 14-1s6-5 10-3" />
    </svg>
  )
}
