import { getDict } from '../../i18n/server'
import { FamilyIcon, HeartDoodle, SparkleRays } from '../doodles'
import styles from './Hero.module.css'

export async function Hero() {
  const { landing } = await getDict()

  return (
    <section className={styles.hero}>
      <HeartDoodle className={styles.heart} size={44} />
      <FamilyIcon className={styles.family} size={64} />

      <div className={styles.titleRow}>
        <SparkleRays className={styles.rays} />
        <h1 className={styles.title}>
          <span className={styles.brand}>{landing.heroTitle}</span>
          <span className={styles.tail}>{landing.heroTitleTail}</span>
        </h1>
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      <p className={styles.ribbon}>{landing.heroRibbon}</p>

      <p className={styles.lead}>{landing.heroLead}</p>

      <p className={styles.hand}>{landing.heroHand}</p>

      <a className={styles.jump} href="#examples">
        {landing.heroJump}
      </a>
    </section>
  )
}
