import type { Metadata } from 'next'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { GoogleLoginButton } from '../../../components/site/GoogleLoginButton'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { getDict, getLang } from '../../../i18n/server'
import { fill } from '../../../i18n/fill'
import { DEFAULT_FAMILY } from '../../../model/family'
import { DEFAULT_LANG } from '../../../model/lang'
import { MAX_PEOPLE, MIN_PEOPLE } from '../../../model/types'
import { auth } from '../../../server/auth'
import { logout } from '../../../server/actions'
import { familyState } from '../../../server/settings'
import { Toast } from '../../../components/site/Toast'
import { FamilyEditor } from './FamilyEditor'
import { LanguageEditor } from './LanguageEditor'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { account } = await getDict()
  return { title: account.title, description: account.description }
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
  /*
   * В адрес уезжает только успех: неудача остаётся в форме вместе с набранным
   * составом (см. `saveFamily`). Причины пустоты приходят из `familyState`,
   * а не пометкой — иначе перезагрузка показывала бы отказ уже починенной базы.
   */
  searchParams: Promise<{ ok?: string }>
}) {
  const lang = await getLang()
  const dict = await getDict()
  const { account } = dict
  const session = await auth()
  const who = session?.user?.name || session?.user?.email

  if (!who) {
    return (
      <PaperSheet>
        <SectionBox accent="deep" label={account.heading} className={styles.section}>
          <h1 className={styles.title}>{account.signedOutTitle}</h1>
          <p className={styles.text}>{account.signedOutText}</p>
          <div className={styles.login}>
            <GoogleLoginButton />
          </div>
          <NewSeasonAction className={styles.primary}>{account.newSeason}</NewSeasonAction>
        </SectionBox>
      </PaperSheet>
    )
  }

  const flags = await searchParams
  const state = await familyState()

  return (
    <PaperSheet>
      <SectionBox accent="deep" label={account.heading} className={styles.section}>
        <h1 className={styles.title}>{who}</h1>
        {session?.user?.email && session.user.name && (
          <p className={styles.sub}>{session.user.email}</p>
        )}

        {/* «Сохранено» показываем только когда состав и правда прочитан:
            пометка в адресе переживает перезагрузку, а состояние базы — нет. */}
        {flags.ok && state.status === 'ok' && (
          <p className={styles.saved} role="status">
            {account.saved}
          </p>
        )}
        {state.status === 'stale' && (
          <div className={styles.warn} role="status">
            <p>{account.staleNote}</p>
            {/* Кнопка, а не совет «нажмите Выйти внизу»: чинится одним кликом. */}
            <GoogleLoginButton label={dict.site.loginAgain} />
          </div>
        )}

        <h2 className={styles.head}>{account.langHead}</h2>
        <p className={styles.text}>{account.langText}</p>

        {/* Настройку показываем, только когда её и правда прочитали — то же
            правило, что у состава: умолчание выдало бы себя за выбор человека.
            Пока выбора не было, показываем язык текущего адреса: он и есть то,
            что человек видит, и `LangSync` уже записал его в базу. */}
        {state.status === 'ok' && (
          <LanguageEditor initial={state.language ?? lang} key={state.language ?? DEFAULT_LANG} />
        )}

        <h2 className={styles.head}>{account.familyHead}</h2>
        <p className={styles.text}>{account.familyText}</p>

        {/* Редактор — только когда состав прочитан. Не прочитан — здесь пусто:
            умолчание выдало бы себя за настоящие настройки, а «Сохранить» —
            это `upsert`, он затёр бы то, чего мы не видели.
            Ключ по составу: после сохранения сервер отдаёт новые данные, и
            редактор должен начать с них, а не держать своё прежнее состояние. */}
        {state.status === 'ok' && (
          <>
            <FamilyEditor
              initial={state.family ?? DEFAULT_FAMILY}
              key={JSON.stringify(state.family)}
            />

            <p className={styles.hint}>
              {fill(account.familyHint, { min: MIN_PEOPLE, max: MAX_PEOPLE })}
            </p>
          </>
        )}

        {/* Об ошибке сервера говорит тост, и только он: отдельной страницы-
            заглушки под отказ базы нет — механизм на весь сайт один. */}
        {state.status === 'error' && <Toast message={account.error} />}

        <h2 className={styles.head}>{account.logoutHead}</h2>
        <form action={logout.bind(null, lang)}>
          <button type="submit" className={styles.ghost}>
            {account.logout}
          </button>
        </form>
      </SectionBox>
    </PaperSheet>
  )
}
