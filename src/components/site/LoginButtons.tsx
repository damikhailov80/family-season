import Link from 'next/link'
import { auth } from '../../server/auth'
import { getDict, getLang } from '../../i18n/server'
import { fill } from '../../i18n/fill'
import { ROUTES, withLang } from '../../model/site'
import { GoogleLoginButton } from './GoogleLoginButton'
import styles from './LoginButtons.module.css'

export async function LoginButtons() {
  const session = await auth()
  const who = session?.user?.name || session?.user?.email
  const lang = await getLang()
  const { site } = await getDict()

  return (
    <div className={styles.wrap}>
      {who ? (
        <Link
          className={styles.who}
          href={withLang(lang, ROUTES.account)}
          title={fill(site.accountTitle, { who })}
        >
          <span className={styles.whoText}>{who}</span>
        </Link>
      ) : (
        <GoogleLoginButton />
      )}
    </div>
  )
}
