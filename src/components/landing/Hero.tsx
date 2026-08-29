import { FamilyIcon, HeartDoodle, SparkleRays } from '../doodles'
import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero}>
      <HeartDoodle className={styles.heart} size={44} />
      <FamilyIcon className={styles.family} size={64} />

      <div className={styles.titleRow}>
        <SparkleRays className={styles.rays} />
        <h1 className={styles.title}>Семейный сезон</h1>
        <SparkleRays className={`${styles.rays} ${styles.raysRight}`} />
      </div>

      <p className={styles.ribbon}>Новый сезон каждый месяц</p>

      <p className={styles.lead}>
        Постер следующего месяца вашей семьи: чем займётесь, что попробуете, куда сходите и кто
        за что взялся. Соберите его заранее, распечатайте и повесьте на холодильник.
      </p>

      <p className={styles.hand}>Не список дел, а афиша: месяц, который хочется прожить.</p>

      {/*
       * Ссылка, а не кнопка: примеры лежат ниже на этой же странице, никакого
       * действия за этим нет. Якорь обычный — прокрутку делает браузер сам,
       * и она работает без JS.
       */}
      <a className={styles.jump} href="#examples">
        Посмотреть примеры ↓
      </a>
    </section>
  )
}
