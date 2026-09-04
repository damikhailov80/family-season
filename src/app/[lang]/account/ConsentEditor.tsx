'use client'

import { useActionState, useState } from 'react'
import { Toast } from '../../../components/site/Toast'
import { useDict, useLang } from '../../../i18n/context'
import type { Dict } from '../../../i18n/types'
import type { Consent } from '../../../model/consent'
import { saveConsentSetting } from '../../../server/actions'
import type { FamilyStatus } from '../../../server/settings'
import styles from './page.module.css'

interface Failure {
  status: Exclude<FamilyStatus, 'ok'>
  at: number
}

function failureText(status: Exclude<FamilyStatus, 'ok'>, account: Dict['account']): string {
  if (status === 'error') return account.saveFailedError
  return status === 'stale' ? account.saveFailedStale : account.saveFailedAnonymous
}

export function ConsentEditor({ initial }: { initial: Consent }) {
  const [value, setValue] = useState<Consent>(initial)
  const { account, consent } = useDict()
  const lang = useLang()

  const [failure, save, saving] = useActionState<Failure | null, FormData>(
    async () => ({ status: await saveConsentSetting(value, lang), at: Date.now() }),
    null,
  )

  return (
    <form className={styles.familyActions} action={save}>
      <label className={styles.visuallyHidden} htmlFor="account-consent">
        {consent.label}
      </label>
      <select
        className={styles.langSelect}
        id="account-consent"
        value={value}
        onChange={(event) => setValue(event.target.value as Consent)}
        disabled={saving}
      >
        <option value="granted">{consent.on}</option>
        <option value="denied">{consent.off}</option>
      </select>
      <button type="submit" className={styles.primary} disabled={saving || value === initial}>
        {saving ? account.saving : consent.save}
      </button>

      {failure && <Toast key={failure.at} message={failureText(failure.status, account)} />}
    </form>
  )
}
