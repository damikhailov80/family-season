'use client'

import { useEffect, useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { sharedHref } from '../../model/site'

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
 * открытии — чтобы `Ctrl+C` сработал и без кнопки. Сама кнопка стоит у поля, а
 * не в ряду вопроса: копируют то, что видят рядом.
 *
 * Обе фразы окна — указания, а не описание механики. «Ссылка открывает сезон для
 * просмотра» и «Ссылки пока нет» пересказывали устройство и состояние, а человек
 * пришёл сюда **поделиться**; во втором случае фраза вдобавок не говорила ничего
 * о том, что даст нажатие. Слово «публичная» тут не годится: публичный сезон на
 * сайте один — тот, что выложен на витрину, а этот виден только по ссылке.
 *
 * Отдельной кнопки «Выдать новую» нет намеренно. Ряд у всех окон один и тот же —
 * `.ghost` слева, `.primary` справа, — а здесь их набиралось четыре, из них три
 * одинаковых. Отзыв и выдача при этом остались обоими: окно от «Отозвать» не
 * закрывается, кнопка справа тут же становится «Создать ссылку».
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
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (token) field.current?.select()
  }, [token])

  const url = token ? `${location.origin}${sharedHref(token)}` : ''

  return (
    <Dialog
      title="Поделиться ссылкой"
      onDismiss={onDismiss}
      actions={
        token ? (
          <>
            <button type="button" className={styles.ghost} onClick={onRevoke} disabled={busy}>
              Отозвать
            </button>
            <button type="button" className={styles.primary} onClick={onDismiss} disabled={busy}>
              Закрыть
            </button>
          </>
        ) : (
          <>
            <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
              Закрыть
            </button>
            <button type="button" className={styles.primary} onClick={onIssue} disabled={busy}>
              Создать ссылку
            </button>
          </>
        )
      }
    >
      <p className={styles.text}>
        {token
          ? 'Отправьте ссылку тому, кому хотите показать сезон.'
          : 'Создайте ссылку, чтобы поделиться сезоном.'}
      </p>

      {token && (
        <>
          <label className={styles.label} htmlFor="share-url">
            Ссылка
          </label>
          <div className={styles.field}>
            <input
              className={`${styles.input} ${styles.url}`}
              id="share-url"
              ref={field}
              type="text"
              value={url}
              readOnly
            />
            <button
              type="button"
              className={styles.primary}
              onClick={() => onCopy(url)}
              disabled={busy}
            >
              Скопировать
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}
