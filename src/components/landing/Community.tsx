import Link from 'next/link'
import { ROUTES } from '../../model/site'
import { SectionBox } from '../SectionBox'
import { SparkStar } from '../doodles'
import styles from './Community.module.css'

/*
 * Ссылка на витрину — next/link: `/ideas` серверная страница сайта, а не постер,
 * и мягкий переход тут ничего не теряет (правило из CLAUDE.md, раздел «Каркас»).
 */
export function Community() {
  return (
    <SectionBox
      accent="projects"
      label="Идеи сообщества"
      note="чужие сезоны целиком"
      className={styles.section}
    >
      <SparkStar className={styles.star} size={26} />
      <p className={styles.text}>
        Придумывать месяц с нуля не обязательно. Семьи выкладывают свои сезоны на общую
        витрину: чей-то «Месяц воды», чьи-то сюжетные линии на четверых, чей-то финал с
        вопросом, на который отвечали всей семьёй. Любой сезон оттуда открывается целиком —
        его можно примерить в своей теме и форкнуть под своих героев, оставив себе только
        то, что понравилось.
      </p>
      <div className={styles.aside}>
        <p className={styles.hand}>
          Показываем каждый раз случайные — заглядывайте, когда свои идеи кончились.
        </p>
        <Link className={styles.primary} href={ROUTES.ideas}>
          Посмотреть идеи сообщества
        </Link>
      </div>
    </SectionBox>
  )
}
