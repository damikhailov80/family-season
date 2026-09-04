'use client'

import { useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict, useLang } from '../../i18n/context'
import { publishText, type PublishStatus } from '../../model/community'
import { LANG_LABELS, LANGS, type Lang } from '../../model/lang'
import { publicSeasonHref } from '../../model/site'

export function PublishDialog({
  check,
  busy,
  seasonLang,
  onLangChange,
  onDismiss,
  onSubmit,
}: {
  check: { status: PublishStatus; code?: string } | null
  busy: boolean
  seasonLang: Lang
  onLangChange: (lang: Lang) => void
  onDismiss: () => void
  onSubmit: (anonymize: boolean) => void
}) {
  const anonymize = useRef<HTMLInputElement>(null)
  const { dialogs } = useDict()
  const lang = useLang()

  const refusal =
    check?.status === 'duplicate' || check?.status === 'blocked' || check?.status === 'limit'
      ? publishText(lang, check.status)
      : null

  if (refusal) {
    return (
      <Dialog
        title={dialogs.publish}
        onDismiss={onDismiss}
        actions={
          <button type="button" className={styles.primary} onClick={onDismiss}>
            {dialogs.close}
          </button>
        }
      >
        <p className={styles.text}>{refusal}</p>
        {check.code && (
          <a className={styles.link} href={publicSeasonHref(seasonLang, check.code)}>
            {dialogs.publishSeeIt}
          </a>
        )}
      </Dialog>
    )
  }

  return (
    <Dialog
      title={dialogs.publish}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            {dialogs.cancel}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(Boolean(anonymize.current?.checked))}
            disabled={busy || !check}
          >
            {busy ? dialogs.publishing : check ? dialogs.publishAction : dialogs.publishChecking}
          </button>
        </>
      }
    >
      <p className={styles.text}>{dialogs.publishHint}</p>

      <label className={styles.label} htmlFor="publish-lang">
        {dialogs.publishLangLabel}
      </label>
      <select
        className={styles.select}
        id="publish-lang"
        value={seasonLang}
        onChange={(event) => onLangChange(event.target.value as Lang)}
        disabled={busy}
      >
        {LANGS.map((item) => (
          <option key={item} value={item}>
            {LANG_LABELS[item]}
          </option>
        ))}
      </select>

      <label className={styles.check}>
        <input className={styles.checkBox} ref={anonymize} type="checkbox" />
        <span>{dialogs.publishAnonymize}</span>
      </label>
    </Dialog>
  )
}
