import type { WeekCard } from '../types'
import styles from './Polaroid.module.css'

interface PolaroidProps {
  week: WeekCard
  index: number
}

/** Детерминированный наклон — карточки не «прыгают» при перерисовке. */
const TILTS = ['-1.6deg', '1.2deg', '-1deg', '1.7deg']

export function Polaroid({ week, index }: PolaroidProps) {
  const tilt = TILTS[index % TILTS.length]

  return (
    <figure className={styles.polaroid} style={{ '--tilt': tilt } as React.CSSProperties}>
      <span className={styles.tape} aria-hidden="true" />
      <div className={styles.photo}>
        {week.photoSrc ? (
          <img className={styles.image} src={week.photoSrc} alt={week.photoAlt} />
        ) : (
          /* Пока фото нет — просто пустое место под него. */
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>
    </figure>
  )
}
