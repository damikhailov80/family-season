'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.css'

/**
 * Обвязка модального окна — одна на все окна сайта.
 *
 * `confirm()` не годится нигде: он вешает вкладку, ломает автоматическую
 * проверку печати и не умеет показать главное — что именно изменится. Поэтому
 * окна нативные, `<dialog>` + `showModal()`; прокрутку под ними запирает
 * `html:has(dialog:modal)` в `global.css`, своего запирания заводить не надо.
 *
 * Окно рисуется, **только пока открыто**: вызывающий монтирует его по своему
 * состоянию, а `onDismiss` ловит и Esc, и клик по подложке, и кнопку отмены —
 * иначе состояние разошлось бы с настоящим состоянием окна и второй раз оно бы
 * не открылось. Способ «висеть в дереве всегда и открываться через `ref`» был
 * вторым и отменён: одна обвязка не может иметь двух повадок открытия, а от
 * монтирования есть и прямая польза — поля внутри каждый раз свежие, и
 * `defaultValue` не приходится класть в узел руками.
 *
 * Ряд кнопок приходит узлом, а не описанием: в нём бывает `<form>` с серверным
 * действием, кнопка входа и одинокая кнопка «Закрыть». Ролей у кнопок две —
 * `.ghost` слева, `.primary` справа, — и третьей, красной «опасной», нет
 * намеренно: цвет светофора на сайте означает предупреждение о потере
 * (`.warning`), а не кнопку.
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
  // Заголовок и `aria-labelledby` связываются сами: захардкоженные id пришлось
  // бы разводить руками там, где на странице несколько одинаковых окон списка.
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
