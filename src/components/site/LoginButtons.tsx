import Link from 'next/link'
import { auth } from '../../server/auth'
import { ROUTES } from '../../model/site'
import { GoogleLoginButton } from './GoogleLoginButton'
import styles from './LoginButtons.module.css'

/**
 * Правый угол шапки: кнопка входа либо имя вошедшего.
 *
 * Имя — **одна ссылка в кабинет**, а не имя плюс «Выйти» рядом: выход это не
 * раздел сайта, а действие над аккаунтом, и место ему среди настроек. Заодно
 * в шапке остаётся один пункт вместо двух.
 *
 * Ссылки на «Мои сезоны» здесь нет намеренно — она уже есть в соседней
 * навигации, а два одинаковых перехода рядом только сбивают.
 */
export async function LoginButtons() {
  const session = await auth()
  const who = session?.user?.name || session?.user?.email

  return (
    <div className={styles.wrap}>
      {who ? (
        <Link className={styles.who} href={ROUTES.account} title={`${who} — кабинет и настройки`}>
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
