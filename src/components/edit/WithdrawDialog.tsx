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
        Убрать с витрины?
      </h2>

      <p className={styles.text}>
        Сезон пропадёт из «Идей сообщества». Если его кто-то отложил в избранное или на
        него была жалоба, он останется открываться по прямой ссылке — забирать отложенное
        у людей мы не будем, а жалоба должна указывать на то, на что подана. Если ничего
        этого не было, публикация исчезнет совсем вместе с лайками. Ваш собственный сезон
        в кабинете это не тронет: на витрине лежала его копия.
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
