'use client'

import { useEffect, useRef, useState } from 'react'
import { COMMENT_LIMIT } from '../../model/community'
import styles from './Dialog.module.css'

/**
 * Жалоба на чужой выложенный сезон.
 *
 * Третий `<dialog>` в проекте и повторяет повадку двух первых: `showModal()` при
 * монтировании, `aria-labelledby`, `.ghost` слева и `.primary` справа. Окно тут
 * нужно не ради подтверждения, а ради **комментария**: жалоба без слов бесполезна
 * тому, кто будет в ней разбираться, поэтому кнопка отправки погашена, пока поле
 * пусто, — а это единственное место в проекте, где содержимое поля вообще влияет
 * на кнопку, и потому оно (в отличие от названия сезона) контролируемое.
 *
 * Текст зовёт в помощники, а не описывает механику. Порог, после которого сезон
 * уходит с витрины, в нём **не назван намеренно**: названное число — это готовая
 * инструкция, как убрать чужой сезон, а нам нужны настоящие жалобы, а не
 * посчитанные. Сказано зато главное: жалоба уходит нам, а не автору, и на что
 * именно стоит жаловаться — примеры человеку нужнее правил.
 */
export function ReportDialog({
  busy,
  sent,
  onDismiss,
  onSubmit,
}: {
  busy: boolean
  /** На этот сезон уже жаловались с этого аккаунта: жалоба не вторая, а уточнённая. */
  sent: boolean
  onDismiss: () => void
  onSubmit: (comment: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [comment, setComment] = useState('')

  // Окно рисуется, только пока открыто, поэтому показывать его надо при монтировании.
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog
      className={styles.dialog}
      ref={dialog}
      onClose={onDismiss}
      aria-labelledby="report-title"
    >
      <h2 className={styles.title} id="report-title">
        {sent ? 'Уточнить жалобу' : 'Пожаловаться на сезон'}
      </h2>

      <p className={styles.text}>
        {sent
          ? 'Новый текст заменит прежний.'
          : 'Напишите, что не так с этим сезоном.'}
      </p>

      <label className={styles.label} htmlFor="report-comment">
        Что не так
      </label>
      <textarea
        className={styles.textarea}
        id="report-comment"
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={COMMENT_LIMIT}
        placeholder="Например: реклама в описании недели"
      />

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Отмена
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => onSubmit(comment)}
          disabled={busy || !comment.trim()}
        >
          {busy ? 'Отправляем…' : 'Отправить'}
        </button>
      </div>
    </dialog>
  )
}
