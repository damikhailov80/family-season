import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PaperSheet } from '../../../../components/PaperSheet'
import { SectionBox } from '../../../../components/SectionBox'
import { SeasonPreview } from '../../../../components/community/SeasonPreview'
import { NewSeasonAction } from '../../../../components/site/NewSeasonAction'
import { getDict, getLang } from '../../../../i18n/server'
import type { Example } from '../../../../model/examples'
import { ideaTitle } from '../../../../model/library'
import { monthPage } from '../../../../model/months'
import { pageMeta } from '../../../../model/meta'
import { withTargetMonth } from '../../../../model/season'
import { shortCode } from '../../../../model/shortcode'
import { ROUTES, withLang } from '../../../../model/site'
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

// The seasons here come from the repository, not the database: our examples are files, and
// SeasonPreview only ever needed the blank and the theme. So the page has no query in it at
// all - it is an article, and it must open when the database is quiet, exactly like the
// landing page. Their month is the rolling one, as everywhere the examples are shown.
function asIdea(example: Example) {
  return {
    code: shortCode('public', example.publicId),
    title: ideaTitle(example.template(), example.lang),
    palette: example.palette,
    template: withTargetMonth(example.template()),
    lang: example.lang,
    likes: 0,
    system: true,
  }
}

export default async function MonthPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lang = await getLang()
  const page = monthPage(lang, slug)
  if (!page) notFound()

  const { text } = page

  return (
    <PaperSheet>
      <SectionBox accent="theme" label={text.label} className={styles.section}>
        <h1 className={styles.title}>{text.heading}</h1>
        {text.lead.map((piece) => (
          <p className={styles.lead} key={piece}>
            {piece}
          </p>
        ))}

        <h2 className={styles.head}>{text.seasonsHead}</h2>
        <p className={styles.text}>{text.seasonsText}</p>

        <ul className={styles.grid}>
          {page.seasons.map((example) => (
            <li className={styles.card} key={example.key}>
              <SeasonPreview idea={asIdea(example)} />
              <p className={styles.summary}>{example.summary}</p>
            </li>
          ))}
        </ul>

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
