'use client'

import { useActionState, useState } from 'react'
import { Toast } from '../../../components/site/Toast'
import { useDict } from '../../../i18n/context'
import type { Dict } from '../../../i18n/types'
import { LANG_LABELS, LANGS, type Lang } from '../../../model/lang'
import { saveLanguage } from '../../../server/actions'
import type { FamilyStatus } from '../../../server/settings'
import styles from './page.module.css'

/**
 * Язык интерфейса в кабинете.
 *
 * Настройка сильнее адреса при заходе на сайт и слабее его на самой странице:
 * пришедший по ссылке `/en/...` видит английский, но его собственный выбор от
 * этого не меняется (см. «Языки» в CLAUDE.md).
 *
 * Клиентский по той же причине, что и `FamilyEditor`: успех уводит редиректом,
 * а неудача возвращается значением и показывается тостом — и её надо куда-то
 * положить, не потеряв выбранное.
 *
 * Уже заведённых сезонов настройка не трогает: язык листа лежит колонкой рядом
 * с содержимым и меняется только при заведении.
 */
interface Failure {
  status: Exclude<FamilyStatus, 'ok'>
  at: number
}

function failureText(status: Exclude<FamilyStatus, 'ok'>, account: Dict['account']): string {
  if (status === 'error') return account.saveFailedError
  return status === 'stale' ? account.saveFailedStale : account.saveFailedAnonymous
}

export function LanguageEditor({ initial }: { initial: Lang }) {
  const [lang, setLang] = useState<Lang>(initial)
  const { account } = useDict()

  const [failure, save, saving] = useActionState<Failure | null, FormData>(
    async () => ({ status: await saveLanguage(lang), at: Date.now() }),
    null,
  )

  return (
    <form className={styles.familyActions} action={save}>
      <label className={styles.visuallyHidden} htmlFor="account-lang">
        {account.langLabel}
      </label>
      <select
        className={styles.langSelect}
        id="account-lang"
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        disabled={saving}
      >
        {LANGS.map((item) => (
          <option key={item} value={item}>
            {LANG_LABELS[item]}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.primary} disabled={saving || lang === initial}>
        {saving ? account.saving : account.saveLanguage}
      </button>

      {failure && <Toast key={failure.at} message={failureText(failure.status, account)} />}
    </form>
  )
}
