import type { Metadata } from 'next'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { GoogleLoginButton } from '../../components/site/LoginButtons'
import { DEFAULT_FAMILY } from '../../model/family'
import { MAX_PEOPLE, MIN_PEOPLE } from '../../model/types'
import { ROUTES } from '../../model/site'
import { auth } from '../../server/auth'
import { loginWithGoogle, logout } from '../../server/actions'
import { familyState } from '../../server/settings'
import { FamilyEditor } from './FamilyEditor'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Кабинет — Семейный сезон',
  description: 'Настройки аккаунта: язык, состав семьи для новых постеров, выход.',
}

/**
 * Личный кабинет. Настройки живут здесь, а не выпадашкой в шапке: выпадашка
 * стала бы первым клиентским компонентом в обвязке сайта, и всё равно упёрлась
 * бы в страницу, как только настроек станет больше одной.
 *
 * Незалогиненного не уводим редиректом — тем же приёмом, что на `/seasons`:
 * адрес обязан открываться и объяснять себя.
 */
export default async function AccountPage({
  searchParams,
}: {
  // Пометки те же, что возвращает `writeFamily`: ok / offline / stale.
  searchParams: Promise<{ ok?: string; offline?: string; stale?: string }>
}) {
  const session = await auth()
  const who = session?.user?.name || session?.user?.email

  if (!who) {
    return (
      <PaperSheet>
        <SectionBox accent="deep" label="Кабинет" className={styles.section}>
          <h1 className={styles.title}>Настройки — для своих</h1>
          <p className={styles.text}>
            Здесь живут язык и состав семьи, с которым открываются новые постеры. Чтобы
            настройки было к чему привязать, нужно войти.
          </p>
          <div className={styles.login}>
            <GoogleLoginButton />
          </div>
          <a className={styles.primary} href={ROUTES.sheetEdit}>
            Собрать свой сезон
          </a>
        </SectionBox>
      </PaperSheet>
    )
  }

  const flags = await searchParams
  const state = await familyState()
  const family = state.status === 'ok' ? (state.family ?? DEFAULT_FAMILY) : DEFAULT_FAMILY
  const offline = state.status === 'offline' || Boolean(flags.offline)
  const stale = state.status === 'stale' || Boolean(flags.stale)

  return (
    <PaperSheet>
      <SectionBox accent="deep" label="Кабинет" className={styles.section}>
        <h1 className={styles.title}>{who}</h1>
        {session?.user?.email && session.user.name && (
          <p className={styles.sub}>{session.user.email}</p>
        )}

        {/* При устаревшей сессии сохранения быть не могло — не показываем оба сразу. */}
        {flags.ok && !stale && (
          <p className={styles.saved} role="status">
            Сохранено ✓
          </p>
        )}
        {stale && (
          <div className={styles.warn} role="status">
            <p>
              Вход был выполнен до того, как появились настройки, поэтому привязать их не к чему.
              Достаточно войти заново — это нужно один раз.
            </p>
            {/* Кнопка, а не совет «нажмите Выйти внизу»: чинится одним кликом. */}
            <form action={loginWithGoogle}>
              <button type="submit" className={styles.ghost}>
                Войти заново
              </button>
            </form>
          </div>
        )}
        {offline && !stale && (
          <p className={styles.warn} role="status">
            Настройки сейчас недоступны — не отвечает хранилище. Постеры, примеры и печать
            работают как обычно, а состав семьи попробуйте сохранить попозже.
          </p>
        )}

        <h2 className={styles.head}>Язык</h2>
        <p className={styles.text}>
          Русский. Других языков пока нет — появятся, и здесь будет из чего выбрать.
        </p>

        <h2 className={styles.head}>Семья для новых постеров</h2>
        <p className={styles.text}>
          С этими героями будет открываться «Новый сезон» — чтобы не собирать семью заново
          каждый месяц. На готовые постеры настройка не влияет: их состав уже вписан в ссылку.
        </p>

        {/* Ключ по составу: после сохранения сервер отдаёт новые данные, и редактор
            должен начать с них, а не держать своё прежнее состояние. */}
        <FamilyEditor initial={family} key={JSON.stringify(family)} />

        <p className={styles.hint}>
          Клик по рисунку меняет героя — как на постере. От {MIN_PEOPLE} до {MAX_PEOPLE} человек;
          имена можно не заполнять, их всегда можно вписать прямо на постере.
        </p>

        <h2 className={styles.head}>Выход</h2>
        <form action={logout}>
          <button type="submit" className={styles.ghost}>
            Выйти
          </button>
        </form>
      </SectionBox>
    </PaperSheet>
  )
}
