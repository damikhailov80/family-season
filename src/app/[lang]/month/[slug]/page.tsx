import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PaperSheet } from '../../../../components/PaperSheet'
import { SectionBox } from '../../../../components/SectionBox'
import { SeasonPreview } from '../../../../components/community/SeasonPreview'
import { NewSeasonAction } from '../../../../components/site/NewSeasonAction'
import { getDict, getLang } from '../../../../i18n/server'
import { monthPage } from '../../../../model/months'
import { pageMeta } from '../../../../model/meta'
import { ROUTES, withLang } from '../../../../model/site'
import { ideasByCode } from '../../../../server/publicSeasons'
import styles from './page.module.css'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const lang = await getLang()
  const [page, { site }] = await Promise.all([Promise.resolve(monthPage(lang, slug)), getDict()])
  if (!page) return {}

  return pageMeta({
    lang,
    path: `${ROUTES.month}/${slug}`,
    title: page.text.title,
    description: page.text.description,
    siteName: site.brand,
    ogAlt: site.ogAlt,
  })
}

export default async function MonthPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lang = await getLang()
  const page = monthPage(lang, slug)
  if (!page) notFound()

  const { text } = page
  // The article is the page; the seasons are read from the showcase and are a bonus. A quiet
  // database, or a season taken off the showcase, leaves the block undrawn - it does not leave
  // the page broken. No toast here either: on the showcase a person came for the seasons, here
  // they came to read.
  const state = await ideasByCode(
    page.seasons.map((season) => season.code),
    lang,
  )
  const ideas = state.status === 'ok' ? state.ideas : []
  const summary = new Map(page.seasons.map((season) => [season.code, season.summary]))

  return (
    <PaperSheet>
      <SectionBox accent="theme" label={text.label} className={styles.section}>
        <h1 className={styles.title}>{text.heading}</h1>
        {text.lead.map((piece) => (
          <p className={styles.lead} key={piece}>
            {piece}
          </p>
        ))}

        {ideas.length > 0 && (
          <>
            <h2 className={styles.head}>{text.seasonsHead}</h2>
            <p className={styles.text}>{text.seasonsText}</p>

            <ul className={styles.grid}>
              {ideas.map((idea) => (
                <li className={styles.card} key={idea.code}>
                  <SeasonPreview idea={idea} />
                  <p className={styles.summary}>{summary.get(idea.code)}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className={styles.head}>{text.actionHead}</h2>
        <p className={styles.text}>{text.actionText}</p>
        <div className={styles.actions}>
          <NewSeasonAction className={styles.primary}>{text.action}</NewSeasonAction>
        </div>

        <p className={styles.text}>{text.moreText}</p>
        <Link className={styles.ghost} href={withLang(lang, ROUTES.ideas)}>
          {text.more}
        </Link>
      </SectionBox>
    </PaperSheet>
  )
}
