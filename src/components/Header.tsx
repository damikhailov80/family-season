import { header } from '../data/content'
import { FamilyIcon, HeartDoodle, SparkleRays } from './doodles'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <HeartDoodle className={styles.heart} size={46} />
      <FamilyIcon className={styles.family} size={66} />

      <div className={styles.titleRow}>
        <SparkleRays className={styles.rays} />
        <h1 className={styles.title}>{header.title}</h1>
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      <p className={styles.ribbon}>{header.ribbon}</p>
    </header>
  )
}
