'use client'

import { useEffect, useRef } from 'react'
import { TITLE_LIMIT } from '../../model/library'
import styles from './Dialog.module.css'

/**
 * Заведение сезона: черновик уезжает в кабинет, чужой или свой постер форкается.
 *
 * Окно нужно ради двух вещей сразу — имени (список без имён нечитаем) и самого
 * подтверждения: заводить строку молча, одним нажатием, слишком похоже на промах
 * по кнопке. `confirm()` не годится: он вешает вкладку и не умеет показать поле.
 *
 * Имя спрашивается не всегда: у невошедшего сезона в коллекции нет, форк ложится
 * черновиком, а у черновика имени не бывает. Тогда `initialTitle` — `null`, и
 * окно остаётся подтверждением: черновик в браузере один, и форк его заменит.
 *
 * Поле неконтролируемое: значение читается с узла при отправке. Контролируемое
 * пришлось бы сбрасывать при каждом изменении бланка — а бланк под окном
 * продолжает жить, и умолчание названия считается из него.
 */
export function NewSeasonDialog({
  heading,
  text,
  initialTitle,
  busy,
  onDismiss,
  onSubmit,
}: {
  heading: string
  text: string
  /** `null` — имени не спрашиваем: сезон ляжет черновиком. */
  initialTitle: string | null
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

      <p className={styles.text}>{text}</p>

      {initialTitle !== null && (
        <>
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
        </>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Отмена
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => onSubmit(input.current?.value ?? initialTitle ?? '')}
          disabled={busy}
        >
          {busy ? 'Заводим…' : 'Готово'}
        </button>
      </div>
    </dialog>
  )
}
