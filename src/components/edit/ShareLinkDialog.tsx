'use client'

import { useEffect, useRef } from 'react'
import { sharedHref } from '../../model/site'
import styles from './Dialog.module.css'

/**
 * Приватная ссылка на свой сезон.
 *
 * Сезон в кабинете не виден никому, кроме хозяина, — а показать его иногда
 * надо: бабушке, второму родителю, кому угодно без аккаунта. Ссылка для этого
 * и заведена: по ней постер открывается на просмотр и форкается, но не правится.
 *
 * Токен случайный, а не выведенный из кода строки, ровно затем, чтобы его можно
 * было **отозвать**: выдали новую — прежняя перестала работать в тот же миг.
 *
 * Поле только для чтения: ссылку тут не правят, её копируют. Выделение при
 * открытии — чтобы `Ctrl+C` сработал и без кнопки.
 */
export function ShareLinkDialog({
  token,
  busy,
  onDismiss,
  onIssue,
  onRevoke,
  onCopy,
}: {
  token: string | null
  busy: boolean
  onDismiss: () => void
  onIssue: () => void
  onRevoke: () => void
  onCopy: (url: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  useEffect(() => {
    if (token) field.current?.select()
  }, [token])

  const url = token ? `${location.origin}${sharedHref(token)}` : ''

  return (
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby="share-link">
      <h2 className={styles.title} id="share-link">
        Личная ссылка
      </h2>

      <p className={styles.text}>
        {token
          ? 'Ссылка открывает сезон для просмотра.'
          : 'Ссылки пока нет.'}
      </p>

      {token && (
        <>
          <label className={styles.label} htmlFor="share-url">
            Ссылка
          </label>
          <input
            className={styles.input}
            id="share-url"
            ref={field}
            type="text"
            value={url}
            readOnly
          />
        </>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
          Закрыть
        </button>
        {token && (
          <button type="button" className={styles.ghost} onClick={onRevoke} disabled={busy}>
            Отозвать
          </button>
        )}
        <button
          type="button"
          className={styles.ghost}
          onClick={onIssue}
          disabled={busy}
          title={token ? 'Прежняя ссылка перестанет работать' : undefined}
        >
          {token ? 'Выдать новую' : 'Создать ссылку'}
        </button>
        {token && (
          <button
            type="button"
            className={styles.primary}
            onClick={() => onCopy(url)}
            disabled={busy}
          >
            Скопировать
          </button>
        )}
      </div>
    </dialog>
  )
}
