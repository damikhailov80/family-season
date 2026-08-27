interface DoodleProps {
  size?: number
  className?: string
  /** Своя толщина для мелкого размера — см. `PrinterDoodle`, причина та же. */
  strokeWidth?: number
}

/** Звено цепи — «скопировать ссылку». Та же сетка и та же манера, что у принтера. */
export function LinkDoodle({ size = 56, className, strokeWidth = 2.3 }: DoodleProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M23.3 30.3a11.7 11.7 0 0 0 17.6 1.3l7-7a11.7 11.7 0 0 0-16.5-16.5l-4 4" />
      <path d="M32.7 25.7a11.7 11.7 0 0 0-17.6-1.3l-7 7a11.7 11.7 0 0 0 16.5 16.5l4-4" />
    </svg>
  )
}
