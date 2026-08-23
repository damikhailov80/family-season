import { ROUTES } from '../../model/site'
import { FamilyIcon, HeartDoodle, SparkleRays } from '../doodles'
import styles from './Hero.module.css'

/*
 * Ссылки в лист — обычные <a>, а не next/link: лист управляет историей руками
 * (pushState с пометкой `own` в DocProvider), и заходить в него свежим документом
 * надёжнее, чем мягким переходом роутера. Страница листа всё равно клиентская,
 * так что на скорости это не сказывается.
 */
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

      <div className={styles.actions}>
        <a className={styles.primary} href={ROUTES.sheet}>
          Посмотреть пример
        </a>
        <a className={styles.ghost} href={ROUTES.sheetEdit}>
          Собрать свой сезон
        </a>
      </div>
    </section>
  )
}
