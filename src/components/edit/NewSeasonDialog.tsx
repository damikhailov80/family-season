'use client'

import { useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict } from '../../i18n/context'
import { TITLE_LIMIT } from '../../model/library'

/**
 * Окно нужно ради двух вещей сразу — имени (список без имён нечитаем) и самого
 * подтверждения: заводить сезон молча слишком похоже на промах по кнопке.
 *
 * Поле неконтролируемое: значение читается с узла при отправке. Контролируемое
 * пришлось бы сбрасывать при каждом изменении бланка — а бланк под окном
 * продолжает жить, и умолчание названия считается из него.
 */
export function NewSeasonDialog({
  heading,
  warning,
  initialTitle,
  busy,
  onDismiss,
  onSubmit,
}: {
  heading: string
  warning?: string
  initialTitle: string
  busy: boolean
  onDismiss: () => void
  onSubmit: (title: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const { dialogs } = useDict()

  return (
    <Dialog
      title={heading}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            {dialogs.cancel}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(input.current?.value ?? initialTitle)}
            disabled={busy}
          >
            {busy ? dialogs.creating : dialogs.done}
          </button>
        </>
      }
    >
      {warning && <p className={styles.warning}>{warning}</p>}

      <label className={styles.label} htmlFor="season-title">
        {dialogs.titleLabel}
      </label>
      <input
        className={styles.input}
        id="season-title"
        ref={input}
        type="text"
        defaultValue={initialTitle}
        maxLength={TITLE_LIMIT}
        autoComplete="off"
      />
    </Dialog>
  )
}
