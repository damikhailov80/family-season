interface DoodleProps {
  size?: number
  className?: string
  /**
   * Толщина обводки. Рисунок нарисован под 56 px лендинга, и общая обводка 2.3
   * на сетке в 56 единиц даёт в кнопке тулбара (19 px) 0,78 экранного пикселя —
   * серую паутину. Мелкому размеру нужна своя толщина, как рисункам в слоте
   * `spark` (см. «Наборы рисунков» в CLAUDE.md).
   */
  strokeWidth?: number
}

export function PrinterDoodle({ size = 56, className, strokeWidth = 2.3 }: DoodleProps) {
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
      {/* Лист, уходящий в принтер сверху */}
      <path d="M17 17V7h22v10" />
      {/* Корпус */}
      <path d="M11 17h34a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3h-6M17 36h-6a3 3 0 0 1-3-3V20a3 3 0 0 1 3-3Z" />
      <path d="M42 24h2" />
      {/* Отпечатанная страница */}
      <path d="M17 30h22v19H17z" />
      <path d="M22 37h12M22 43h8" />
    </svg>
  )
}
