'use client'

import { useState } from 'react'
import { useDict } from '../../i18n/context'
import { Dialog } from '../dialog/Dialog'
import dialogStyles from '../dialog/Dialog.module.css'
import styles from './PosterZoom.module.css'

// A thumbnail asks for a closer look: the first press shows both sheets large, and going on to
// the example - to change it and print it - is a separate, named action inside.
export function PosterZoom({
  title,
  pages,
  href,
  size,
}: {
  title: string
  // Every printed sheet, first to last; the first one is the thumbnail.
  pages: { src: string; alt: string }[]
  href: string
  // A prop and not an import: model/posters reads the examples registry, which must stay on
  // the server.
  size: { width: number; height: number }
}) {
  const { dialogs, printable } = useDict()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={styles.zoom} onClick={() => setOpen(true)}>
        <img
          className={styles.thumb}
          src={pages[0].src}
          alt={pages[0].alt}
          width={size.width}
          height={size.height}
          loading="lazy"
        />
      </button>

      {open && (
        <Dialog
          wide
          title={title}
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button type="button" className={dialogStyles.ghost} onClick={() => setOpen(false)}>
                {dialogs.close}
              </button>
              <a className={`${dialogStyles.primary} ${styles.open}`} href={href}>
                {printable.open}
              </a>
            </>
          }
        >
          <div className={styles.pages}>
            {pages.map((page) => (
              <img
                className={styles.large}
                key={page.src}
                src={page.src}
                alt={page.alt}
                width={size.width}
                height={size.height}
              />
            ))}
          </div>
        </Dialog>
      )}
    </>
  )
}
