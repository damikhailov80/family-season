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
      sealDraft()
      location.assign(seasonHref(uiLang, result.code, 'edit'))
      return
    }
    setNotice({
      text: libraryText(
        uiLang,
        result.status === 'ok' || result.status === 'anonymous' ? 'stale' : result.status,
      ),
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={bars.toolbarDraftAria}>
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

      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
