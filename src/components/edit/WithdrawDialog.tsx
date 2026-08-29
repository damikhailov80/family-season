'use client'

import { useEffect, useRef } from 'react'
import styles from './Dialog.module.css'

/**
 * Убрать свой сезон с витрины.
 *
 * Спрашиваем не для порядка: что станет с публикацией, зависит от чужих людей,
 * и сказать об этом можно только заранее. Отложили в избранное — строка
 * останется жить по прямой ссылке (иначе она пропала бы у них из кабинета);
 * не отложил никто — уходит совсем, вместе с лайками.
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
        Убрать с витрины?
      </h2>

      <p className={styles.text}>
        Сезон пропадёт из «Идей сообщества». Если его кто-то отложил в избранное, он
        останется открываться по прямой ссылке — забирать отложенное у людей мы не будем.
        Если не отложил никто, публикация исчезнет совсем вместе с лайками. Ваш собственный
        сезон в кабинете это не тронет: на витрине лежала его копия.
      </p>

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
