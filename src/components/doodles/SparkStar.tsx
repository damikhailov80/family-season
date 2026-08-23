interface SparkStarProps {
  size?: number
  className?: string
}

const STAR_PATH =
  'M0,-10 L3.48,-2.53 L9.51,-3.09 L4.09,1.33 L5.88,8.09 L0,4.3 L-5.88,8.09 L-4.09,1.33 L-9.51,-3.09 L-3.48,-2.53 Z'

export function SparkStar({ size = 24, className }: SparkStarProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={STAR_PATH} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
