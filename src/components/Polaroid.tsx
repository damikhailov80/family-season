import { useDoc } from '../state/docContext'
import styles from './Polaroid.module.css'

const TILTS = ['-1.6deg', '1.2deg', '-1deg', '1.7deg']

export function Polaroid({ index }: { index: number }) {
  const { fill } = useDoc()
  const tilt = TILTS[index % TILTS.length]
  const photo = fill.photos[String(index)]

  return (
    <figure className={styles.polaroid} style={{ '--tilt': tilt } as React.CSSProperties}>
      <span className={styles.tape} aria-hidden="true" />
      <div className={styles.photo}>
        <div className={styles.placeholder} aria-hidden="true" />
        {photo && <img className={styles.image} src={photo} alt="" />}
      </div>
    </figure>
  )
}
