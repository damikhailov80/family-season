'use client'

import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { LOGIN_TEXT, type LoginReason } from '../../model/community'
import { GoogleLoginButton } from '../site/GoogleLoginButton'

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
 * Стоит он справа, на месте `.primary`: порядок «отказ слева, действие справа»
 * один на все окна.
 */
export function LoginDialog({ reason, onClose }: { reason: LoginReason; onClose: () => void }) {
  return (
    // onDismiss ловит и Esc, и закрытие по подложке — состояние обязано сойтись
    // с настоящим состоянием окна, иначе второй раз оно не откроется.
    <Dialog
      title="Нужен вход"
      onDismiss={onClose}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Не сейчас
          </button>
          <GoogleLoginButton />
        </>
      }
    >
      <p className={styles.text}>{LOGIN_TEXT[reason]}</p>
    </Dialog>
  )
}
