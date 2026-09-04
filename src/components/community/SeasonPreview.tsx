import { posterText } from '../../model/labels'
import { publicSeasonHref } from '../../model/site'
import type { Idea } from '../../server/publicSeasons'

import styles from './SeasonPreview.module.css'

export function SeasonPreview({ idea }: { idea: Idea }) {
  const { template } = idea
  const placeholders = posterText(idea.lang).placeholders

  const shown = (value: string, fallback: string) => value.trim() || fallback

  return (
    <a
      className={styles.paper}
      data-palette={idea.palette}
      href={publicSeasonHref(idea.lang, idea.code)}
    >
      <span className={styles.headline}>
        {shown(template.theme.subtitle, placeholders.subtitle)}
      </span>
      <span className={styles.question}>
        {shown(template.theme.question, placeholders.question)}
      </span>

      <span className={styles.weeks}>
        {template.weeks.map((week, index) => (
          <span className={styles.week} key={week.title || index}>
            <b className={styles.weekTitle}>
              {shown(week.title, `${placeholders.weekTitle} ${index + 1}`)}
            </b>
            <span className={styles.weekText}>{shown(week.text, placeholders.weekText)}</span>
          </span>
        ))}
      </span>

      <span className={styles.goal}>{shown(template.goal, placeholders.goal)}</span>
    </a>
  )
}
