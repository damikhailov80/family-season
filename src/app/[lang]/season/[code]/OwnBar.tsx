'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { LinkDoodle, MegaphoneDoodle, PrinterDoodle } from '../../../../components/doodles'
import { NewSeasonDialog } from '../../../../components/edit/NewSeasonDialog'
import { PublishDialog } from '../../../../components/edit/PublishDialog'
import { RenameDialog } from '../../../../components/edit/RenameDialog'
import { ShareLinkDialog } from '../../../../components/edit/ShareLinkDialog'
import { Toast } from '../../../../components/site/Toast'
import { useDict, useLang } from '../../../../i18n/context'
import { fill } from '../../../../i18n/fill'
import { publishText, type PublishStatus } from '../../../../model/community'
import type { Lang } from '../../../../model/lang'
import { posterText } from '../../../../model/labels'
import { defaultSeasonTitle, libraryText, normalizeTitle } from '../../../../model/library'
import type { SharedLink } from '../../../../model/qr'
import { publicSeasonHref, seasonHref } from '../../../../model/site'
import {
  previewShare,
  renameSeason,
  revokeLink,
  shareLink,
  shareSeason,
  storeSeason,
} from '../../../../server/actions'
import { useDoc } from '../../../../state/docContext'
import styles from '../../../../components/edit/Bar.module.css'

export function OwnBar({
  code,
  editing,
  title,
  link,
  onLink,
}: {
  code: string
  editing: boolean
  title: string
  link: SharedLink | null
  onLink: (link: SharedLink | null) => void
}) {
  const { template, palette, iconSet, lang } = useDoc()
  const uiLang = useLang()
  const { bars, dialogs } = useDict()
  const [forkOpen, setForkOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishLang, setPublishLang] = useState<Lang>(lang)
  const [check, setCheck] = useState<{ status: PublishStatus; code?: string } | null>(null)
  const checkRun = useRef(0)
  const [linkOpen, setLinkOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)
  const [name, setName] = useState(title)
  const [renameOpen, setRenameOpen] = useState(false)

  const rename = async (next: string) => {
    const clean = normalizeTitle(next, name || posterText(lang).untitled)
    setBusy(true)
    const status = clean === name ? 'ok' : await renameSeason(code, clean, lang)
    setBusy(false)
    setRenameOpen(false)
    if (status === 'ok') {
      setName(clean)
      return
    }
    setNotice({ text: libraryText(uiLang, status as 'limit' | 'stale' | 'error'), at: Date.now() })
  }

  const fork = async (title: string) => {
    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet, lang })
    setBusy(false)
    setForkOpen(false)
    if (result.status === 'ok' && result.code) {
      location.assign(seasonHref(uiLang, result.code, 'edit'))
      return
    }
    setNotice({
      text: libraryText(uiLang, result.status as 'limit' | 'stale' | 'error'),
      at: Date.now(),
    })
  }

  const issueLink = async () => {
    setBusy(true)
    const result = await shareLink(code, lang)
    setBusy(false)
    if (result.status === 'ok' && result.link) onLink(result.link)
    else
      setNotice({
        text: libraryText(uiLang, result.status as 'limit' | 'stale' | 'error'),
        at: Date.now(),
      })
  }

  const dropLink = async () => {
    setBusy(true)
    const status = await revokeLink(code)
    setBusy(false)
    if (status === 'ok') onLink(null)
    else
      setNotice({
        text: libraryText(uiLang, status as 'limit' | 'stale' | 'error'),
        at: Date.now(),
      })
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setLinkOpen(false)
      setNotice({ text: bars.linkCopied, at: Date.now() })
    } catch {
      setNotice({ text: bars.linkCopyByHand, at: Date.now() })
    }
  }

  const openPublish = () => {
    setPublishLang(lang)
    askShowcase(lang)
    setPublishOpen(true)
  }

  const askShowcase = (next: Lang) => {
    const run = ++checkRun.current
    setCheck(null)
    void previewShare(code, next).then((result) => {
      if (checkRun.current === run) setCheck(result)
    })
  }

  const publish = async (anonymize: boolean) => {
    setBusy(true)
    const result = await shareSeason(code, anonymize, publishLang)
    setBusy(false)
    setPublishOpen(false)
    if (result.code) {
      location.assign(
        `${publicSeasonHref(publishLang, result.code)}?published=${result.fresh ? 'new' : 'again'}`,
      )
      return
    }
    setNotice({
      text: publishText(uiLang, result.status as 'duplicate' | 'limit' | 'stale' | 'error'),
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={bars.toolbarAria}>
        {editing ? (
          <button
            type="button"
            className={`${styles.hint} ${styles.rename}`}
            onClick={() => setRenameOpen(true)}
            title={bars.rename}
          >
            {fill(bars.withTitle, { place: bars.placeOwn, title: name })}
          </button>
        ) : (
          <span className={styles.hint}>
            {fill(bars.withTitle, { place: bars.placeOwn, title: name })}
          </span>
        )}
        <span className={styles.actions}>
          <Link
            className={styles.primary}
            href={seasonHref(uiLang, code, editing ? 'view' : 'edit')}
          >
            {editing ? bars.ready : bars.edit}
          </Link>
          {!editing && (
            <>
              <button
                type="button"
                className={styles.ghost}
                disabled={busy}
                onClick={() => setForkOpen(true)}
              >
                {dialogs.forkAction}
              </button>
              <button
                type="button"
                className={styles.icon}
                disabled={busy}
                aria-pressed={Boolean(link)}
                onClick={() => setLinkOpen(true)}
                title={link ? bars.linkIssued : bars.linkNone}
                aria-label={link ? bars.linkIssued : bars.linkNone}
              >
                <LinkDoodle size={19} strokeWidth={3.4} />
              </button>
              <button
                type="button"
                className={styles.icon}
                disabled={busy}
                onClick={openPublish}
                title={bars.publish}
                aria-label={bars.publish}
              >
                <MegaphoneDoodle size={19} strokeWidth={4} />
              </button>
            </>
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

      {forkOpen && (
        <NewSeasonDialog
          heading={dialogs.fork}
          initialTitle={defaultSeasonTitle(template, lang)}
          busy={busy}
          onDismiss={() => setForkOpen(false)}
          onSubmit={(title) => void fork(title)}
        />
      )}
      {linkOpen && (
        <ShareLinkDialog
          token={link?.token ?? null}
          busy={busy}
          onDismiss={() => setLinkOpen(false)}
          onIssue={() => void issueLink()}
          onRevoke={() => void dropLink()}
          onCopy={(url) => void copyLink(url)}
        />
      )}
      {renameOpen && (
        <RenameDialog
          title={name}
          busy={busy}
          onDismiss={() => setRenameOpen(false)}
          onSubmit={(next) => void rename(next)}
        />
      )}
      {publishOpen && (
        <PublishDialog
          check={check}
          busy={busy}
          seasonLang={publishLang}
          onLangChange={(next) => {
            setPublishLang(next)
            askShowcase(next)
          }}
          onDismiss={() => setPublishOpen(false)}
          onSubmit={(anonymize) => void publish(anonymize)}
        />
      )}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
