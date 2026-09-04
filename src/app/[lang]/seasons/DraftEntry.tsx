'use client'

import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Dialog } from '../../../components/dialog/Dialog'
import dialogStyles from '../../../components/dialog/Dialog.module.css'
import { PenDoodle } from '../../../components/doodles'
import { useDict, useLang } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import { monthInText, monthName } from '../../../model/calendar'
import {
  clearDraft,
  draftSnapshot,
  parseDraft,
  subscribeDraft,
  writeDraft,
} from '../../../model/draft'
import { savedOn, TITLE_LIMIT } from '../../../model/library'
import { paletteLabel } from '../../../model/palettes'
import { sheetHref } from '../../../model/site'
import styles from './page.module.css'

export function DraftEntry() {
  const lang = useLang()
  const dict = useDict()
  const { seasons, dialogs } = dict
  const raw = useSyncExternalStore(subscribeDraft, draftSnapshot, () => undefined)
  const draft = useMemo(() => (raw === undefined ? null : parseDraft(raw)), [raw])
  const input = useRef<HTMLInputElement>(null)
  const [renaming, setRenaming] = useState(false)
  const [dropping, setDropping] = useState(false)

  if (raw === undefined) return null

  if (!draft) {
    return <p className={styles.hand}>{dict.status.emptyList}</p>
  }

  const rename = () => {
    const title = input.current?.value ?? draft.title
    setRenaming(false)
    writeDraft({ ...draft, title })
  }

  const drop = () => {
    setDropping(false)
    clearDraft()
  }

  return (
    <>
      <ul className={styles.entries}>
        <li className={styles.entry}>
          <span
            className={styles.ink}
            data-palette={draft.palette}
            title={paletteLabel(draft.palette, lang)}
            aria-hidden="true"
          />
          <span className={styles.entryText}>
            <a className={styles.entryTitle} href={sheetHref(lang)}>
              {draft.title}
            </a>
            <span className={styles.entryMeta}>
              {seasons.savedAt} {savedOn(new Date(draft.savedAt), lang)} ·{' '}
              {monthInText(monthName(draft.template.theme, draft.lang), draft.lang)}{' '}
              {draft.template.theme.year}
            </span>
          </span>
          <span className={styles.rowTools}>
            <button
              type="button"
              className={styles.rowButton}
              onClick={() => setRenaming(true)}
              title={fill(seasons.renameOne, { title: draft.title })}
              aria-label={fill(seasons.renameOne, { title: draft.title })}
            >
              <PenDoodle size={16} strokeWidth={3.6} />
            </button>
            <button
              type="button"
              className={styles.rowButton}
              onClick={() => setDropping(true)}
              aria-label={fill(seasons.removeOne, { title: draft.title })}
            >
              ×
            </button>
          </span>
        </li>
      </ul>

      {renaming && (
        <Dialog
          title={dialogs.rename}
          onDismiss={() => setRenaming(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                onClick={() => setRenaming(false)}
              >
                {dialogs.cancel}
              </button>
              <button type="button" className={dialogStyles.primary} onClick={rename}>
                {dialogs.save}
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>{dialogs.renameHint}</p>
          <label className={dialogStyles.label} htmlFor="draft-title">
            {dialogs.titleLabel}
          </label>
          <input
            className={dialogStyles.input}
            id="draft-title"
            ref={input}
            type="text"
            defaultValue={draft.title}
            maxLength={TITLE_LIMIT}
            autoComplete="off"
          />
        </Dialog>
      )}

      {dropping && (
        <Dialog
          title={seasons.removeHeading}
          onDismiss={() => setDropping(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                onClick={() => setDropping(false)}
              >
                {dialogs.cancel}
              </button>
              <button type="button" className={dialogStyles.primary} onClick={drop}>
                {seasons.removeAction}
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>
            {fill(seasons.removeDraftAsk, { title: draft.title })}
          </p>
        </Dialog>
      )}
    </>
  )
}
