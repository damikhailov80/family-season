import Link from 'next/link'
import { auth } from '../../server/auth'
import { getDict, getLang } from '../../i18n/server'
import { fill } from '../../i18n/fill'
import { ROUTES, withLang } from '../../model/site'
import { GoogleLoginButton } from './GoogleLoginButton'
import styles from './LoginButtons.module.css'

/**
 * Имя — одна ссылка в кабинет, а не имя плюс «Выйти» рядом: выход это действие
 * над аккаунтом, и место ему среди настроек.
 */
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
          {/* Обёртка не лишняя: `text-overflow` не действует на flex-контейнер,
              и без неё длинное имя обрезалось бы по рамке без многоточия. */}
          <span className={styles.whoText}>{who}</span>
        </Link>
      ) : (
        <GoogleLoginButton />
      )}
    </div>
  )
}
