'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrinterDoodle } from '../../../components/doodles'
import { Toast } from '../../../components/site/Toast'
import { useDict, useLang } from '../../../i18n/context'
import { sealDraft } from '../../../model/draft'
import { libraryText } from '../../../model/library'
import { seasonHref, sheetHref } from '../../../model/site'
import { storeSeason } from '../../../server/actions'
import { useDoc } from '../../../state/docContext'
import styles from '../../../components/edit/Bar.module.css'

/**
 * Вход известен заранее, пропом со страницы: невошедшему «Сохранить в мои сезоны»
 * показывать нельзя — коллекции у него нет. Своей кнопки входа у панели при этом
 * тоже нет: вход любой кнопкой сам увозит черновик в коллекцию (`ClaimDraft`).
 *
 * Залитая кнопка в ряду одна и не переезжает при смене режима: заливку носит
 * переключатель «Править»/«Готово». Раньше она прыгала с кнопки на кнопку, и ряд
 * мигал на каждом переключении.
 */
export function DraftBar({
  editing,
  title,
  signedIn,
}: {
  editing: boolean
  title: string
  signedIn: boolean
}) {
  const { template, palette, iconSet, lang } = useDoc()
  const uiLang = useLang()
  const { bars } = useDict()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const store = async () => {
    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet, lang })
    setBusy(false)
    if (result.status === 'ok' && result.code) {
      // Запираем, а не просто стираем: `DraftStore` рядом пишет дебаунсом и
      // вернул бы вычищенное.
      sealDraft()
      location.assign(seasonHref(uiLang, result.code, 'edit'))
      return
    }
    // `anonymous` приходит только с протухшей кукой и лечится тем же, чем `stale`.
    setNotice({
      text: libraryText(
        uiLang,
        // `anonymous` лечится тем же, чем `stale`; `ok` без кода невозможен,
        // но проверка стоит рядом, а не в вере.
        result.status === 'ok' || result.status === 'anonymous' ? 'stale' : result.status,
      ),
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={bars.toolbarDraftAria}>
        {/* Одна фраза на обе роли: где лежит черновик — всё, что тут стоит сказать. */}
        <span className={styles.hint}>{bars.placeDraft}</span>
        <span className={styles.actions}>
          <Link className={styles.primary} href={sheetHref(uiLang, editing ? 'view' : 'edit')}>
            {editing ? bars.ready : bars.edit}
          </Link>
          {signedIn && (
            <button
              type="button"
              className={styles.ghost}
              disabled={busy}
              onClick={() => void store()}
            >
              {busy ? bars.saving : bars.save}
            </button>
          )}
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
