'use client'

import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

/**
 * Единственный способ, которым сайт сообщает об ошибке сервера. Механизм один
 * на всё: **тост говорит, что случилось, а на месте данных остаётся пусто** —
 * отдельных страниц-заглушек под каждый отказ не заводим.
 *
 * Клиентский компонент в обвязке сайта — пока единственный. Иначе никак:
 * сообщение обязано само уходить и закрываться по кнопке.
 *
 * Рисовать его может и серверный компонент (страница знает об ошибке при
 * рендере), и клиентский (отказ пришёл в ответ на действие). Повторный отказ
 * показывается заново, если сменить `key` — тост монтируется с нуля.
 */
export function Toast({ message, timeout = 7000 }: { message: string; timeout?: number }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setVisible(false), timeout)
    return () => clearTimeout(id)
  }, [timeout])

  if (!visible) return null

  return (
    // `alert`, а не `status`: ошибку скринридер должен прочитать сразу, не
    // дожидаясь паузы в речи.
    <div className={styles.toast} role="alert">
      <p className={styles.text}>{message}</p>
      <button
        type="button"
        className={styles.close}
        onClick={() => setVisible(false)}
        aria-label="Закрыть сообщение"
      >
        ×
      </button>
    </div>
  )
}
