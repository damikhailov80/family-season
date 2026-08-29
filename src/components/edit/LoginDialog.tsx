'use client'

import { useEffect, useRef } from 'react'
import { LOGIN_TEXT, type LoginReason } from '../../model/community'
import { GoogleLoginButton } from '../site/GoogleLoginButton'
import styles from './Dialog.module.css'

/**
 * «Нужен вход».
 *
 * Окно открывается не заранее, а по нажатию: кнопки ★, ♥ и флажок показываются
 * всем, и только когда до дела дошло, мы спрашиваем про вход.
 *
 * Заголовок общий, а фраза под ним берётся из `LOGIN_TEXT` по причине, с которой
 * окно открыли: она называет то, что человек нажал, — и больше ничего.
 *
 * Внутри — обычный `GoogleLoginButton`. Он клиентский ровно затем, чтобы
 * собрать адрес возврата из `pathname + search + hash`: примеренное оформление
 * живёт в адресе, и без этого человек вернулся бы из Google на другой постер.
 */
export function LoginDialog({ reason, onClose }: { reason: LoginReason; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)

  // Окно рисуется, только пока открыто, поэтому показывать его надо при
  // монтировании — как у остальных окон проекта.
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  return (
    // onClose ловит и Esc, и закрытие по подложке — состояние обязано сойтись
    // с настоящим состоянием окна, иначе второй раз оно не откроется.
    <dialog className={styles.dialog} ref={dialog} onClose={onClose} aria-labelledby="login-title">
      <h2 className={styles.title} id="login-title">
        Нужен вход
      </h2>
      <p className={styles.text}>{LOGIN_TEXT[reason]}</p>
      <div className={styles.actions}>
        <GoogleLoginButton />
        <button type="button" className={styles.ghost} onClick={onClose}>
          Не сейчас
        </button>
      </div>
    </dialog>
  )
}
