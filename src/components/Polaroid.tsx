import { useDoc } from '../state/docContext'
import styles from './Polaroid.module.css'

/** Детерминированный наклон — карточки не «прыгают» при перерисовке. */
const TILTS = ['-1.6deg', '1.2deg', '-1deg', '1.7deg']

/** В бланке рамка пустая: путь к фото живёт в слое заполнения, не в шаблоне. */
export function Polaroid({ index }: { index: number }) {
  const { fill } = useDoc()
  const tilt = TILTS[index % TILTS.length]
  const photo = fill.photos[String(index)]

  return (
    <figure className={styles.polaroid} style={{ '--tilt': tilt } as React.CSSProperties}>
      <span className={styles.tape} aria-hidden="true" />
      <div className={styles.photo}>
        {/* Место под вклейку рисуется всегда, а фото ложится поверх. Так в печати,
            где фото скрыто, рамка выглядит ровно как у недели без фотографии. */}
        <div className={styles.placeholder} aria-hidden="true" />
        {photo && <img className={styles.image} src={photo} alt="" />}
      </div>
    </figure>
  )
}
