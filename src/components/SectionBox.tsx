import type { AccentColor } from '../types'
import { Badge } from './Badge'
import styles from './SectionBox.module.css'

interface SectionBoxProps {
  accent: AccentColor
  label?: string
  /** Подпись справа от плашки (курсивом, как на макете). */
  note?: React.ReactNode
  /** Произвольное содержимое строки заголовка вместо note. */
  headerExtra?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  labelId?: string
}

/**
 * Каркас почти всех блоков макета: скруглённый бокс с цветной рамкой и
 * плашкой-заголовком, наезжающей на верхнюю границу.
 */
export function SectionBox({
  accent,
  label,
  note,
  headerExtra,
  children,
  className,
  bodyClassName,
  labelId,
}: SectionBoxProps) {
  return (
    <div
      className={[styles.box, className].filter(Boolean).join(' ')}
      style={{ '--accent': `var(--${accent})` } as React.CSSProperties}
    >
      {(label || note || headerExtra) && (
        <div className={styles.head}>
          {label && (
            <Badge accent={accent} className={styles.badge}>
              <span id={labelId}>{label}</span>
            </Badge>
          )}
          {note && <span className={styles.note}>{note}</span>}
          {headerExtra}
        </div>
      )}
      <div className={[styles.body, bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </div>
  )
}
