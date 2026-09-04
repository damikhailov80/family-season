import type { Metadata } from 'next'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { CONTACT_EMAIL } from '../../../model/site'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { getDict } from '../../../i18n/server'
import { marked } from '../../../i18n/fill'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { privacy } = await getDict()
  return { title: privacy.title, description: privacy.description }
}

/** Абзац с выделением: в словаре оно размечено `**звёздочками**` (см. `marked`). */
function Text({ children }: { children: string }) {
  return (
    <p className={styles.text}>
      {marked(children).map((piece, index) =>
        piece.bold ? <b key={index}>{piece.text}</b> : piece.text,
      )}
    </p>
  )
}

/**
 * Заведена не для галочки: без её адреса Google не выпускает вход из режима
 * Testing в продакшен. Появилось в базе что-то новое — страница переписывается
 * тем же изменением, иначе она начнёт врать.
 */
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
