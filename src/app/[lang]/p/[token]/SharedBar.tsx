'use client'

import { useState } from 'react'
import { LinkDoodle, PrinterDoodle } from '../../../../components/doodles'
import { ForkButton } from '../../../../components/edit/ForkButton'
import { Toast } from '../../../../components/site/Toast'
import { useDict } from '../../../../i18n/context'
import styles from '../../../../components/edit/Bar.module.css'

/**
 * Ни лайка, ни жалобы, ни звёздочки: сезон не на витрине, его показали лично.
 * Остаётся то, ради чего ссылку и присылают: посмотреть, распечатать, форкнуть.
 */
export function SharedBar({ signedIn }: { signedIn: boolean }) {
  const { bars } = useDict()
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setNotice({ text: bars.linkCopied, at: Date.now() })
    } catch {
      prompt(bars.linkPrompt, location.href)
    }
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={bars.toolbarAria}>
        <span className={styles.hint}>{bars.placeShared}</span>
        <span className={styles.actions}>
          <ForkButton
            signedIn={signedIn}
            onFailure={(text) => setNotice({ text, at: Date.now() })}
          />
          <button
            type="button"
            className={styles.icon}
            onClick={() => void copyLink()}
            title={bars.copyLinkShort}
            aria-label={bars.copyLinkShort}
          >
            <LinkDoodle size={19} strokeWidth={3.4} />
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={() => print()}
            title={bars.printTitle}
            aria-label={bars.printTitle}
          >
            <PrinterDoodle size={19} strokeWidth={3.4} />
          </button>
        </span>
      </div>

      {/* Тост — вне бара: у `.bar` есть `backdrop-filter`, а он делает элемент
          содержащим блоком для `position: fixed`. */}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
