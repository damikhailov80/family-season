import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { LikeCount } from '../../../components/community/LikeCount'
import { SeasonPreview } from '../../../components/community/SeasonPreview'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { Toast } from '../../../components/site/Toast'
import { getDict, getLang } from '../../../i18n/server'
import { fill } from '../../../i18n/fill'
import { pageMeta } from '../../../model/meta'
import { ROUTES, withLang } from '../../../model/site'
import { auth } from '../../../server/auth'
import { randomIdeas } from '../../../server/publicSeasons'
import { ReportEntry } from './ReportEntry'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { ideas, site } = await getDict()
  return pageMeta({
    lang: await getLang(),
    path: ROUTES.ideas,
    title: ideas.title,
    description: ideas.description,
    siteName: site.brand,
    ogAlt: site.ogAlt,
  })
}

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>
}) {
  const flags = await searchParams
  const next = (Number(flags.r) || 0) + 1
  const lang = await getLang()
  const dict = await getDict()
  const [state, session] = await Promise.all([randomIdeas(lang), auth()])
  const ideas = state.status === 'ok' ? state.ideas : []

  return (
    <PaperSheet>
      <SectionBox accent="theme" label={dict.ideas.heading} heading="h1" className={styles.section}>
        <p className={styles.text}>{dict.ideas.lead}</p>

        {state.status === 'ok' &&
          (ideas.length ? (
            <>
              <ul className={styles.grid}>
                {ideas.map((idea) => (
                  <li className={styles.card} key={idea.code}>
                    <SeasonPreview idea={idea} />
                    <div className={styles.meta}>
                      <LikeCount
                        likes={idea.likes}
                        size={14}
                        className={styles.likes}
                        label={fill(dict.ideas.likesAria, { n: idea.likes })}
                      />
                      {!idea.system && (
                        <ReportEntry
                          code={idea.code}
                          title={idea.title}
                          signedIn={Boolean(session?.user)}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                <Link className={styles.primary} href={`${withLang(lang, ROUTES.ideas)}?r=${next}`}>
                  {dict.ideas.another}
                </Link>
                <NewSeasonAction className={styles.ghost}>{dict.ideas.newSeason}</NewSeasonAction>
              </div>

              <p className={styles.note}>{dict.ideas.note}</p>
            </>
          ) : (
            <>
              <p className={styles.hand}>{dict.ideas.emptyHand}</p>
              <div className={styles.actions}>
                <NewSeasonAction className={styles.primary}>{dict.ideas.newSeason}</NewSeasonAction>
                <a className={styles.ghost} href={withLang(lang, ROUTES.home)}>
                  {dict.ideas.seeExamples}
                </a>
              </div>
              <p className={styles.note}>{dict.ideas.emptyNote}</p>
            </>
          ))}

        {state.status === 'error' && <Toast message={dict.ideas.error} />}
      </SectionBox>
    </PaperSheet>
  )
}
