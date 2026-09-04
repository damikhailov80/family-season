import type { Metadata } from 'next'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { pageMeta } from '../../../model/meta'
import { CONTACT_EMAIL, ROUTES } from '../../../model/site'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { getDict, getLang } from '../../../i18n/server'
import { marked } from '../../../i18n/fill'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { privacy, site } = await getDict()
  return pageMeta({
    lang: await getLang(),
    path: ROUTES.privacy,
    title: privacy.title,
    description: privacy.description,
    siteName: site.brand,
    ogAlt: site.ogAlt,
  })
}

function Text({ children }: { children: string }) {
  return (
    <p className={styles.text}>
      {marked(children).map((piece, index) =>
        piece.bold ? <b key={index}>{piece.text}</b> : piece.text,
      )}
    </p>
  )
}

export default async function PrivacyPage() {
  const { privacy } = await getDict()

  return (
    <PaperSheet>
      <SectionBox accent="deep" label={privacy.heading} className={styles.section}>
        <h1 className={styles.title}>{privacy.lead1}</h1>
        <p className={styles.lead}>{privacy.lead2}</p>

        <h2 className={styles.head}>{privacy.loginHead}</h2>
        <Text>{privacy.loginText}</Text>

        <h2 className={styles.head}>{privacy.anonHead}</h2>
        <Text>{privacy.anonText}</Text>

        <h2 className={styles.head}>{privacy.dbHead}</h2>
        <Text>{privacy.dbIntro}</Text>
        <Text>{privacy.dbSettings}</Text>
        <Text>{privacy.dbSeasons}</Text>
        <Text>{privacy.dbPublic}</Text>

        <h2 className={styles.head}>{privacy.whereHead}</h2>
        <Text>{privacy.whereText}</Text>
        <Text>{privacy.whereNote}</Text>

        <h2 className={styles.head}>{privacy.othersHead}</h2>
        <Text>{privacy.othersIntro}</Text>
        <Text>{privacy.othersLink}</Text>
        <Text>{privacy.othersShowcase}</Text>

        <h2 className={styles.head}>{privacy.cookiesHead}</h2>
        <Text>{privacy.cookiesText}</Text>

        <h2 className={styles.head}>{privacy.analyticsHead}</h2>
        <Text>{privacy.analyticsText}</Text>

        <h2 className={styles.head}>{privacy.deleteHead}</h2>
        <Text>{privacy.deleteText}</Text>

        <h2 className={styles.head}>{privacy.nextHead}</h2>
        <Text>{privacy.nextText}</Text>

        <p className={styles.text}>
          {privacy.contact}{' '}
          <a className={styles.mail} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <p className={styles.updated}>{privacy.updated}</p>

        <NewSeasonAction className={styles.primary}>{privacy.newSeason}</NewSeasonAction>
      </SectionBox>
    </PaperSheet>
  )
}
