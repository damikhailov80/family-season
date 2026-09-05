import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { getDict, getLang } from '../../../i18n/server'
import { pageMeta } from '../../../model/meta'
import { monthList } from '../../../model/months'
import { monthHref, ROUTES } from '../../../model/site'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { monthsPage, site } = await getDict()
  return pageMeta({
    lang: await getLang(),
    path: ROUTES.month,
    title: monthsPage.title,
    description: monthsPage.description,
    siteName: site.brand,
    ogAlt: site.ogAlt,
  })
}

export default async function MonthsPage() {
  const lang = await getLang()
  const { monthsPage, site } = await getDict()

  return (
    <PaperSheet>
      <SectionBox accent="theme" label={site.months} className={styles.section}>
        <h1 className={styles.title}>{monthsPage.heading}</h1>
        <p className={styles.lead}>{monthsPage.lead}</p>

        <ul className={styles.list}>
          {monthList(lang).map((month) => (
            <li key={month.slug}>
              <Link className={styles.row} href={monthHref(lang, month.slug)}>
                <span className={styles.month}>{month.label}</span>
                <span className={styles.what}>{month.heading}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <NewSeasonAction className={styles.primary}>{site.newSeason}</NewSeasonAction>
        </div>
      </SectionBox>
    </PaperSheet>
  )
}
