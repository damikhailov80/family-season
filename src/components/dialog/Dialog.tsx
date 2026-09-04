'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.css'

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
