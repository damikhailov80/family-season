'use client'

import { useEffect, useRef } from 'react'
import { TITLE_LIMIT } from '../../model/library'
import styles from './Dialog.module.css'

/**
 * Заведение сезона: черновик уезжает в кабинет, чужой или свой постер форкается,
 * новый сезон собирается с нуля.
 *
 * Окно нужно ради двух вещей сразу — имени (список без имён нечитаем) и самого
 * подтверждения: заводить сезон молча, одним нажатием, слишком похоже на промах
 * по кнопке. `confirm()` не годится: он вешает вкладку и не умеет показать поле.
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
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // Окно рисуется, только пока открыто, поэтому показывать его надо при монтировании.
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    // Esc и клик по подложке закрывают окно и оставляют всё как было.
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby="new-season">
      <h2 className={styles.title} id="new-season">
        {heading}
      </h2>

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

      <div className={styles.actions}>
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
      </div>
    </dialog>
  )
}
