'use client'

import { useState } from 'react'
import { LinkDoodle, PrinterDoodle } from '../../../components/doodles'
import { ForkButton } from '../../../components/edit/ForkButton'
import { Toast } from '../../../components/site/Toast'
import styles from '../../../components/edit/Bar.module.css'

/**
 * Панель сезона, присланного по личной ссылке.
 *
 * Ни лайка, ни жалобы, ни звёздочки: сезон не на витрине, его показали лично —
 * оценивать и раскладывать по своим полкам тут нечего. Остаётся то, ради чего
 * ссылку и присылают: посмотреть, распечатать, форкнуть себе.
 *
 * Хозяин может отозвать ссылку в любой момент, поэтому подсказка честно говорит,
 * что сезон **прислали**, а не выложили.
 */
export function SharedBar({ signedIn }: { signedIn: boolean }) {
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      setNotice({ text: 'Ссылка скопирована — можно переслать дальше', at: Date.now() })
    } catch {
      // Без разрешения на буфер — показываем ссылку, скопирует руками.
      prompt('Ссылка на сезон:', location.href)
    }
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label="Действия с сезоном">
        <span className={styles.hint}>
          Этот сезон прислали вам по личной ссылке — посмотрите и заберите себе
        </span>
        <span className={styles.actions}>
          <ForkButton
            signedIn={signedIn}
            onFailure={(text) => setNotice({ text, at: Date.now() })}
          />
          <button
            type="button"
            className={styles.icon}
            onClick={() => void copyLink()}
            title="Скопировать ссылку"
            aria-label="Скопировать ссылку"
          >
            <LinkDoodle size={19} strokeWidth={3.4} />
          </button>
          <button
            type="button"
            className={styles.icon}
            onClick={() => print()}
            title="Печать / PDF"
            aria-label="Печать / PDF"
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
