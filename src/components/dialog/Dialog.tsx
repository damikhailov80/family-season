'use client'

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './Dialog.module.css'

export function Dialog({
  title,
  onDismiss,
  actions,
  children,
  wide = false,
}: {
  title: string
  onDismiss: () => void
  actions: ReactNode
  children?: ReactNode
  wide?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    const target = event.target as HTMLElement
    // A focused button already reacts to Enter on its own; a textarea needs Enter for line breaks.
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return

    const primary = dialog.current?.querySelector<HTMLButtonElement>(
      `.${styles.actions} .${styles.primary}`,
    )
    if (!primary || primary.disabled) return

    event.preventDefault()
    primary.click()
  }

  return (
    <dialog
      className={wide ? `${styles.dialog} ${styles.wide}` : styles.dialog}
      ref={dialog}
      onClose={onDismiss}
      onKeyDown={handleKeyDown}
      aria-labelledby={titleId}
    >
      <h2 className={styles.title} id={titleId}>
        {title}
      </h2>
      {children}
      <div className={styles.actions}>{actions}</div>
    </dialog>
  )
}
