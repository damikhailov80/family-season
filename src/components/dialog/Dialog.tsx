'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.css'

/**
 * Обвязка модального окна — одна на все окна сайта. `confirm()` не годится нигде:
 * он вешает вкладку, ломает автоматическую проверку печати и не умеет показать
 * главное — что именно изменится.
 *
 * Окно рисуется, только пока открыто: вызывающий монтирует его по своему
 * состоянию, а `onDismiss` ловит и Esc, и клик по подложке, и кнопку отмены —
 * иначе состояние разошлось бы с настоящим и второй раз окно бы не открылось.
 *
 * Ряд кнопок приходит узлом, а не описанием: в нём бывает `<form>` с серверным
 * действием, кнопка входа и одинокая «Закрыть».
 */
export function Dialog({
  title,
  onDismiss,
  actions,
  children,
}: {
  title: string
  onDismiss: () => void
  actions: ReactNode
  children?: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  // Захардкоженные id пришлось бы разводить руками там, где на странице
  // несколько одинаковых окон списка.
  const titleId = useId()

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    <dialog className={styles.dialog} ref={dialog} onClose={onDismiss} aria-labelledby={titleId}>
      <h2 className={styles.title} id={titleId}>
        {title}
      </h2>
      {children}
      <div className={styles.actions}>{actions}</div>
    </dialog>
  )
}
