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
  // The poster keeps the label a plain span: it prints, and its sections are not a page
  // outline. Site pages opt in, because there the badge IS the heading of the page.
  heading?: 'h1' | 'h2'
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
  heading,
}: SectionBoxProps) {
  const Label = heading ?? 'span'

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
              <Label className={styles.label} id={labelId}>
                {label}
              </Label>
            </Badge>
          )}
          {note && <span className={styles.note}>{note}</span>}
        </div>
      )}
      <div className={[styles.body, bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </div>
  )
}
