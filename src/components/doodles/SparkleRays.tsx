interface DoodleProps {
  size?: number
  className?: string
}

/** Три коротких «луча» — жёлтые штрихи по бокам заголовка. */
export function SparkleRays({ size = 34, className }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.6}
      viewBox="0 0 34 54"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 9l13 9M2 29h16M4 49l13-9" />
    </svg>
  )
}
