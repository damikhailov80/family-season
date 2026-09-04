'use client'

import { useEffect, useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict, useLang } from '../../i18n/context'
import { sharedHref } from '../../model/site'

/**
 * Поле только для чтения: ссылку тут не правят, её копируют. Выделение при
 * открытии — чтобы `Ctrl+C` сработал и без кнопки; сама кнопка стоит у поля, а не
 * в ряду окна: копируют то, что видят рядом.
 *
 * Отдельной кнопки «Выдать новую» нет намеренно — их набиралось четыре, из них
 * три одинаковых. Отзыв и выдача остались оба: окно от «Отозвать» не закрывается,
 * и правая кнопка тут же становится «Создать ссылку».
 */
export function ShareLinkDialog({
  token,
  busy,
  onDismiss,
  onIssue,
  onRevoke,
  onCopy,
}: {
  token: string | null
  busy: boolean
  onDismiss: () => void
  onIssue: () => void
  onRevoke: () => void
  onCopy: (url: string) => void
}) {
  const field = useRef<HTMLInputElement>(null)
  const { dialogs } = useDict()
  const lang = useLang()

  useEffect(() => {
    if (token) field.current?.select()
  }, [token])

  const url = token ? `${location.origin}${sharedHref(lang, token)}` : ''

  return (
    <Dialog
      title={dialogs.share}
      onDismiss={onDismiss}
      actions={
        token ? (
          <>
            <button type="button" className={styles.ghost} onClick={onRevoke} disabled={busy}>
              {dialogs.shareRevoke}
            </button>
            <button type="button" className={styles.primary} onClick={onDismiss} disabled={busy}>
              {dialogs.close}
            </button>
          </>
        ) : (
          <>
            <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
              {dialogs.close}
            </button>
            <button type="button" className={styles.primary} onClick={onIssue} disabled={busy}>
              {dialogs.shareCreate}
            </button>
          </>
        )
      }
    >
      <p className={styles.text}>{token ? dialogs.shareHave : dialogs.shareNone}</p>

      {token && (
        <>
          <label className={styles.label} htmlFor="share-url">
            {dialogs.shareLabel}
          </label>
          <div className={styles.field}>
            <input
              className={`${styles.input} ${styles.url}`}
              id="share-url"
              ref={field}
              type="text"
              value={url}
              readOnly
            />
            <button
              type="button"
              className={styles.primary}
              onClick={() => onCopy(url)}
              disabled={busy}
            >
              {dialogs.shareCopy}
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}
