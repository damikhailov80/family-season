'use client'

import { useEffect, useRef } from 'react'
import { GoogleLoginButton } from '../site/GoogleLoginButton'
import styles from './Dialog.module.css'

/**
 * «Чтобы сохранять сезоны, нужно войти».
 *
 * Окно открывается не заранее, а по отказу: кнопки ★ и «Сохранить» показываются
 * всем, действие уходит на сервер и возвращает `anonymous` — только тогда мы и
 * спрашиваем про вход. Так постер не обязан знать, вошёл человек или нет, и
 * работает без сервера как прежде.
 *
 * Внутри — обычный `GoogleLoginButton`. Он клиентский ровно затем, чтобы
 * собрать адрес возврата из `pathname + search + hash`: сезон живёт в хэше, и
 * без этого человек вернулся бы из Google на пустой бланк.
 */
export function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  return (
    // onClose ловит и Esc, и закрытие по подложке — состояние обязано сойтись
    // с настоящим состоянием окна, иначе второй раз оно не откроется.
    <dialog className={styles.dialog} ref={dialog} onClose={onClose} aria-labelledby="login-title">
      <h2 className={styles.title} id="login-title">
        Нужен вход
      </h2>
      <p className={styles.text}>
        Сезоны и избранное лежат в вашем кабинете, поэтому их надо к чему-то привязать. После
        входа вы вернётесь на этот же постер — ничего из набранного не потеряется.
      </p>
      <div className={styles.login}>
        <GoogleLoginButton />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onClose}>
          Не сейчас
        </button>
      </div>
    </dialog>
  )
}
