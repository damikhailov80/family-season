'use client'

import { useEffect, useRef } from 'react'
import { TITLE_LIMIT } from '../../model/library'
import styles from './Dialog.module.css'

/**
 * Переименование сезона с самого постера.
 *
 * Окно, а не поле в ряду: имя бывает длиной в целую строку, и поле, растущее
 * вместе с набранным, дёргало ряд кнопок при каждом знаке. Окно к тому же
 * повторяет повадку соседей — `showModal()`, «Отмена» слева, действие справа.
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
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // Окно рисуется, только пока открыто, поэтому показывать его надо при монтировании.
  useEffect(() => {
    dialog.current?.showModal()
    input.current?.select()
  }, [])

  return (
    // Esc и клик по подложке закрывают окно и оставляют имя как было.
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby="rename-season">
      <h2 className={styles.title} id="rename-season">
        Новое название
      </h2>
      <p className={styles.text}>Введите новое имя для сезона.</p>

      <label className={styles.label} htmlFor="rename-title">
        Название
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

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Отмена
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => onSubmit(input.current?.value ?? title)}
          disabled={busy}
        >
          Сохранить
        </button>
      </div>
    </dialog>
  )
}
