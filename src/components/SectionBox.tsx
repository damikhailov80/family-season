import type { AccentSlot } from '../types'
import { Badge } from './Badge'
import styles from './SectionBox.module.css'

interface SectionBoxProps {
  accent: AccentSlot
  label?: string
  note?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  labelId?: string
  id?: string
}

export function SectionBox({
  accent,
  label,
  note,
  children,
  className,
  bodyClassName,
  labelId,
  id,
}: SectionBoxProps) {
  return (
    <div
      id={id}
      className={[styles.box, className].filter(Boolean).join(' ')}
      style={{ '--accent': `var(--accent-${accent})` } as React.CSSProperties}
    >
      {(label || note) && (
        <div className={styles.head}>
          {label && (
            <Badge accent={accent} className={styles.badge}>
              <span id={labelId}>{label}</span>
            </Badge>
          )}
          {note && <span className={styles.note}>{note}</span>}
        </div>
      )}
      <div className={[styles.body, bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </div>
  )
}
