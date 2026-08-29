'use client'

import { useEffect, useRef } from 'react'
import styles from './Dialog.module.css'

/**
 * Выложить сезон на витрину.
 *
 * Окно спрашивает подтверждение и предлагает обезличить имена — и больше ничего.
 * Что на витрину уезжает **копия**, что связь с этим сезоном обрывается и что
 * одинакового контента витрина не держит, в тексте не разбирается: это устройство
 * сайта (см. «Витрина» в CLAUDE.md), а не забота нажимающего.
 *
 * Галочка обезличивания стоит здесь же, а не в настройках: решение принимают
 * про конкретный сезон, а не вообще. Имена подменяются только в копии — свой
 * сезон остаётся с настоящими.
 */
export function PublishDialog({
  busy,
  onDismiss,
  onSubmit,
}: {
  busy: boolean
  onDismiss: () => void
  onSubmit: (anonymize: boolean) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const anonymize = useRef<HTMLInputElement>(null)

  // Окно рисуется, только пока открыто, поэтому показывать его надо при монтировании.
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby="publish">
      <h2 className={styles.title} id="publish">
        Выложить на витрину
      </h2>

      <p className={styles.text}>Копия сезона появится в «Идеях сообщества».</p>

      <label className={styles.check}>
        <input className={styles.checkBox} ref={anonymize} type="checkbox" />
        <span>Заменить имена на случайные</span>
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Отмена
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => onSubmit(Boolean(anonymize.current?.checked))}
          disabled={busy}
        >
          {busy ? 'Выкладываем…' : 'Выложить'}
        </button>
      </div>
    </dialog>
  )
}
