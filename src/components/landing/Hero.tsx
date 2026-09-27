import { fill } from '../../i18n/fill'
import { getDict, getLang } from '../../i18n/server'
import { ideaTitle } from '../../model/library'
import { POSTER_IMAGE, randomPoster } from '../../model/posters'
import { PosterZoom } from '../community/PosterZoom'
import { FamilyIcon, HeartDoodle, SparkleRays } from '../doodles'
import styles from './Hero.module.css'

export async function Hero() {
  const lang = await getLang()
  const { landing, printable } = await getDict()
  const poster = randomPoster(lang)
  const title = poster ? ideaTitle(poster.example.template(), lang) : ''

  return (
    <section className={styles.hero}>
      <HeartDoodle className={styles.heart} size={44} />
      <FamilyIcon className={styles.family} size={64} />

      <div className={styles.titleRow}>
        <SparkleRays className={styles.rays} />
        <h1 className={styles.title}>
          <span className={styles.brand}>{landing.heroTitle}</span>{' '}
          <span className={styles.tail}>{landing.heroTitleTail}</span>
        </h1>
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      <p className={styles.ribbon}>{landing.heroRibbon}</p>

      <div className={styles.intro}>
        <div className={styles.text}>
          <p className={styles.lead}>{landing.heroLead}</p>

          <p className={styles.hand}>{landing.heroHand}</p>

          <a className={styles.jump} href="#examples">
            {landing.heroJump}
          </a>
        </div>

        {poster && (
          <div className={styles.poster}>
            <PosterZoom
              title={title}
              pages={[
                { src: poster.pages[0], alt: fill(printable.alt, { title }) },
                { src: poster.pages[1], alt: fill(printable.altSecond, { title }) },
              ]}
              href={poster.example.href}
              size={POSTER_IMAGE}
            />
          </div>
        )}
      </div>
    </section>
  )
}
