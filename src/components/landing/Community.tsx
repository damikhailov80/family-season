import Link from 'next/link'
import { getDict, getLang } from '../../i18n/server'
import { ROUTES, withLang } from '../../model/site'
import { SectionBox } from '../SectionBox'
import { SparkStar } from '../doodles'
import styles from './Community.module.css'

/*
 * Ссылка на витрину — next/link: `/ideas` серверная страница сайта, а не постер,
 * и мягкий переход тут ничего не теряет (правило из CLAUDE.md, раздел «Каркас»).
 */
export async function Community() {
  const lang = await getLang()
  const { landing } = await getDict()

  return (
    <SectionBox
      accent="projects"
      label={landing.communityLabel}
      note={landing.communityNote}
      className={styles.section}
    >
      <SparkStar className={styles.star} size={26} />
      <p className={styles.text}>{landing.communityText}</p>
      <div className={styles.aside}>
        <p className={styles.hand}>{landing.communityHand}</p>
        <Link className={styles.primary} href={withLang(lang, ROUTES.ideas)}>
          {landing.communityAction}
        </Link>
      </div>
    </SectionBox>
  )
}
