'use client'

import { useEffect, useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict } from '../../i18n/context'
import { TITLE_LIMIT } from '../../model/library'

/**
 * Переименование сезона с самого постера.
 *
 * Окно, а не поле в ряду: имя бывает длиной в целую строку, и поле, растущее
 * вместе с набранным, дёргало ряд кнопок при каждом знаке.
 *
 * Поле неконтролируемое: значение читается с узла при отправке, как в окне
 * заведения сезона.
 */
export function RenameDialog({
  title,
  busy,
  onDismiss,
  onSubmit,
}: {
  title: string
  busy: boolean
  onDismiss: () => void
  onSubmit: (title: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const { dialogs } = useDict()

  useEffect(() => {
    input.current?.select()
  }, [])

  return (
    // Esc и клик по подложке закрывают окно и оставляют имя как было.
    <Dialog
      title={dialogs.rename}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            {dialogs.cancel}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(input.current?.value ?? title)}
            disabled={busy}
          >
            {dialogs.save}
          </button>
        </>
      }
    >
      <p className={styles.text}>{dialogs.renameHint}</p>

      <label className={styles.label} htmlFor="rename-title">
        {dialogs.titleLabel}
      </label>
      <input
        className={styles.input}
        id="rename-title"
        ref={input}
        type="text"
        defaultValue={title}
        maxLength={TITLE_LIMIT}
        autoComplete="off"
      />
    </Dialog>
  )
}
