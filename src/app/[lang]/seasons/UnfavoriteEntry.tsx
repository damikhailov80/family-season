import { getDict, getLang } from '../../../i18n/server'
import { fill } from '../../../i18n/fill'
import { unfavoriteEntry } from '../../../server/actions'
import styles from './page.module.css'

export async function UnfavoriteEntry({
  code,
  title,
  back,
}: {
  code: string
  title: string
  back: string
}) {
  const lang = await getLang()
  const { seasons } = await getDict()
  const label = fill(seasons.unfavoriteOne, { title })

  return (
    <form action={unfavoriteEntry.bind(null, code, back, lang)}>
      <button type="submit" className={styles.rowButton} title={label} aria-label={label}>
        ×
      </button>
    </form>
  )
}
