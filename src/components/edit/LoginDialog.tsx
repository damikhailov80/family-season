'use client'

import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict, useLang } from '../../i18n/context'
import { loginText, type LoginReason } from '../../model/community'
import { GoogleLoginButton } from '../site/GoogleLoginButton'

export function LoginDialog({ reason, onClose }: { reason: LoginReason; onClose: () => void }) {
  const { dialogs } = useDict()
  const lang = useLang()

  return (
    <Dialog
      title={dialogs.login}
      onDismiss={onClose}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onClose}>
            {dialogs.notNow}
          </button>
          <GoogleLoginButton />
        </>
      }
    >
      <p className={styles.text}>{loginText(lang, reason)}</p>
    </Dialog>
  )
}
