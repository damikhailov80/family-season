'use client'

import { useRef } from 'react'
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
  code,
  title,
  back,
}: {
  code: string
  title: string
  back: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => dialog.current?.showModal()}
        aria-label={`Удалить «${title}»`}
      >
        ×
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby={`drop-${code}`}>
        <h2 className={styles.dialogTitle} id={`drop-${code}`}>
          Удалить «{title}»?
        </h2>
        <p className={styles.dialogText}>
          Другой копии сезона нет ни у вас, ни у нас: постер живёт этой строкой и пропадёт
          совсем.
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
          <form action={dropEntry.bind(null, code, back)}>
            <button type="submit" className={styles.danger}>
              Удалить
            </button>
          </form>
        </div>
      </dialog>
    </>
  )
}
