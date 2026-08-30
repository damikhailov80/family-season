'use client'

import { useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { TITLE_LIMIT } from '../../model/library'

/**
 * Заведение сезона: черновик уезжает в кабинет, чужой или свой постер форкается,
 * новый сезон собирается с нуля.
 *
 * Окно нужно ради двух вещей сразу — имени (список без имён нечитаем) и самого
 * подтверждения: заводить сезон молча, одним нажатием, слишком похоже на промах
 * по кнопке.
 *
 * Имя спрашивается **всегда** — и у вошедшего, и у невошедшего. Раньше у
 * черновика имени не бывало, потому что он нигде не показывался; теперь он
 * строка в списке на `/seasons`, и безымянным ей быть незачем.
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

  return (
    // Esc и клик по подложке закрывают окно и оставляют всё как было.
    <Dialog
      title={heading}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(input.current?.value ?? initialTitle)}
            disabled={busy}
          >
            {busy ? 'Заводим…' : 'Готово'}
          </button>
        </>
      }
    >
      {warning && <p className={styles.warning}>{warning}</p>}

      <label className={styles.label} htmlFor="season-title">
        Название
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
