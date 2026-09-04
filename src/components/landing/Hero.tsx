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
        <h1 className={styles.title}>{landing.heroTitle}</h1>
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      <p className={styles.ribbon}>{landing.heroRibbon}</p>

      <p className={styles.lead}>{landing.heroLead}</p>

      <p className={styles.hand}>{landing.heroHand}</p>

      {/* Ссылка, а не кнопка: примеры лежат ниже на этой же странице, и прокрутку
          делает сам браузер — работает и без JS. */}
      <a className={styles.jump} href="#examples">
        {landing.heroJump}
      </a>
    </section>
  )
}
