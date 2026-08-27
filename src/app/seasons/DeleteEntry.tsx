'use client'

import { useRef } from 'react'
import type { LibraryKind } from '../../model/library'
import { dropEntry } from '../../server/actions'
import styles from './page.module.css'

/**
 * Удаление строки из библиотеки — с подтверждением.
 *
 * Второй клиентский компонент сайта после `FamilyEditor`, и заведён по той же
 * причине: без JS подтверждение стоило бы отдельного экрана и лишнего перехода.
 * Сам список при этом остаётся серверным — клиентская здесь одна кнопка.
 *
 * Спрашиваем не для порядка: другой копии сезона у сайта нет, и если ссылка на
 * него больше нигде не осталась, постер пропадает совсем.
 */
export function DeleteEntry({
  kind,
  id,
  title,
  back,
}: {
  kind: LibraryKind
  id: string
  title: string
  back: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        className={styles.remove}
        onClick={() => dialog.current?.showModal()}
        aria-label={`Удалить «${title}»`}
      >
        ×
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby={`drop-${id}`}>
        <h2 className={styles.dialogTitle} id={`drop-${id}`}>
          Удалить «{title}»?
        </h2>
        <p className={styles.dialogText}>
          {kind === 'seasons'
            ? 'Другой копии сезона у нас нет. Если ссылка на него не сохранилась где-то ещё, постер пропадёт совсем.'
            : 'Закладка исчезнет из избранного. Сам постер никуда не денется — он живёт в своей ссылке.'}
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => dialog.current?.close()}
          >
            Отмена
          </button>
          {/* Действие серверное: аргументы привязаны, но проверяются заново —
              привязка уезжает в браузер и возвращается оттуда. */}
          <form action={dropEntry.bind(null, kind, id, back)}>
            <button type="submit" className={styles.danger}>
              Удалить
            </button>
          </form>
        </div>
      </dialog>
    </>
  )
}
