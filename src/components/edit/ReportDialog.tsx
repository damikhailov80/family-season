'use client'

import { useState } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict } from '../../i18n/context'
import { COMMENT_LIMIT } from '../../model/community'

/**
 * Окно нужно ради комментария, а не подтверждения: жалоба без слов бесполезна
 * тому, кто будет в ней разбираться, поэтому поле контролируемое и кнопка
 * погашена, пока оно пусто.
 *
 * Порог, после которого сезон уходит на разбор, в тексте не назван намеренно:
 * названное число — готовая инструкция, как убрать чужой сезон.
 */
export function ReportDialog({
  busy,
  sent,
  onDismiss,
  onSubmit,
}: {
  busy: boolean
  /** На сезон уже жаловались с этого аккаунта: жалоба не вторая, а уточнённая. */
  sent: boolean
  onDismiss: () => void
  onSubmit: (comment: string) => void
}) {
  const [comment, setComment] = useState('')
  const { dialogs } = useDict()

  return (
    <Dialog
      title={sent ? dialogs.reportAgain : dialogs.report}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            {dialogs.cancel}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(comment)}
            disabled={busy || !comment.trim()}
          >
            {busy ? dialogs.reportSending : dialogs.reportSend}
          </button>
        </>
      }
    >
      <p className={styles.text}>{sent ? dialogs.reportAgainHint : dialogs.reportHint}</p>

      <label className={styles.label} htmlFor="report-comment">
        {dialogs.reportLabel}
      </label>
      <textarea
        className={styles.textarea}
        id="report-comment"
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={COMMENT_LIMIT}
        placeholder={dialogs.reportPlaceholder}
      />
    </Dialog>
  )
}
