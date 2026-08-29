'use client'

import { useEffect, useRef } from 'react'
import styles from './Dialog.module.css'

/**
 * Убрать свой сезон с витрины.
 *
 * Спрашиваем не для порядка: что станет с публикацией, зависит не только от
 * автора. Отложили её в избранное или пожаловались на неё — строка остаётся жить
 * по прямой ссылке (у людей не должно пропадать отложенное, а жалоба обязана
 * указывать на то, на что подана); не случилось ни того ни другого — уходит
 * совсем, вместе с лайками.
 */
export function WithdrawDialog({
  busy,
  onDismiss,
  onSubmit,
}: {
  busy: boolean
  onDismiss: () => void
  onSubmit: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby="withdraw">
      <h2 className={styles.title} id="withdraw">
        Убрать с витрины
      </h2>

      {/* Один вопрос про то, что человек нажал. Почему публикация иногда
          остаётся жить по ссылке, а иногда исчезает совсем, — устройство
          витрины, а не его забота (см. «Витрина» в CLAUDE.md). */}
      <p className={styles.text}>Вы уверены, что хотите убрать сезон из «Идей сообщества»?</p>

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Отмена
        </button>
        <button type="button" className={styles.primary} onClick={onSubmit} disabled={busy}>
          {busy ? 'Убираем…' : 'Убрать'}
        </button>
      </div>
    </dialog>
  )
}
