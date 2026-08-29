import { DEFAULT_EXAMPLE_ID, exampleById } from '../../model/examples'
import { FamilyIcon, HeartDoodle, SparkleRays } from '../doodles'
import { NewSeasonAction } from '../site/NewSeasonAction'
import styles from './Hero.module.css'

/*
 * Ссылки в постер — обычные <a>, а не next/link: страницы постера клиентские и
 * тянут за собой свой кусок бандла, так что мягкий переход выигрывает немного, а
 * свежий документ надёжнее — на нём точно не останется состояния лендинга.
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
        <a className={styles.primary} href={exampleById(DEFAULT_EXAMPLE_ID)!.href}>
          Посмотреть пример
        </a>
        <NewSeasonAction className={styles.ghost}>Собрать свой сезон</NewSeasonAction>
      </div>
    </section>
  )
}
