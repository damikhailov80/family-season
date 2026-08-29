'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LinkDoodle, MegaphoneDoodle, PrinterDoodle } from '../../../components/doodles'
import { NewSeasonDialog } from '../../../components/edit/NewSeasonDialog'
import { PublishDialog } from '../../../components/edit/PublishDialog'
import { ShareLinkDialog } from '../../../components/edit/ShareLinkDialog'
import { Toast } from '../../../components/site/Toast'
import { PUBLISH_TEXT } from '../../../model/community'
import { defaultSeasonTitle, LIBRARY_TEXT } from '../../../model/library'
import { publicSeasonHref, seasonHref } from '../../../model/site'
import { revokeLink, shareLink, shareSeason, storeSeason } from '../../../server/actions'
import { useDoc } from '../../../state/docContext'
import styles from '../../../components/edit/Bar.module.css'

/**
 * Панель своего сезона.
 *
 * «Сохранить» здесь нет: сезон лежит строкой и записывается сам (`Autosave`).
 * «Править» и «Готово» — обычные ссылки на соседний путь, и это **`next/link`**,
 * а не полная навигация: переход внутри страницы даёт незаписанной правке уйти
 * на сервер из размонтирования, а перезагрузка документа оборвала бы её.
 *
 * «Форкнуть» есть и у своего сезона: следующий месяц собирают из прошлого, а
 * прошлый при этом должен остаться. В правке кнопки нет — там правят эту самую
 * строку, и заводить рядом вторую посреди работы незачем.
 *
 * Мегафон — «выложить на витрину», и он тоже только в просмотре: правящийся
 * постер наружу не отдают. После удачи уходим на **адрес копии**: у выложенного
 * сезона своя жизнь и своя ссылка, и показать надо именно её. Дубль уводит туда
 * же — человеку нужен не отказ, а тот самый сезон, который уже лежит на витрине.
 */
export function OwnBar({
  code,
  editing,
  token,
}: {
  code: string
  editing: boolean
  /** Токен приватной ссылки; `null` — её не выдавали. */
  token: string | null
}) {
  const { template, palette, iconSet } = useDoc()
  const [forkOpen, setForkOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  // Ответ известен из самого действия — переспрашивать сервер незачем.
  const [link, setLink] = useState(token)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)

  const fork = async (title: string) => {
    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet })
    setBusy(false)
    setForkOpen(false)
    if (result.status === 'ok' && result.code) {
      location.assign(seasonHref(result.code, 'edit'))
      return
    }
    setNotice({ text: LIBRARY_TEXT[result.status as 'limit' | 'stale' | 'error'], at: Date.now() })
  }

  const issueLink = async () => {
    setBusy(true)
    const result = await shareLink(code)
    setBusy(false)
    if (result.status === 'ok' && result.token) setLink(result.token)
    else setNotice({ text: LIBRARY_TEXT[result.status as 'limit' | 'stale' | 'error'], at: Date.now() })
  }

  const dropLink = async () => {
    setBusy(true)
    const status = await revokeLink(code)
    setBusy(false)
    if (status === 'ok') setLink(null)
    else setNotice({ text: LIBRARY_TEXT[status as 'limit' | 'stale' | 'error'], at: Date.now() })
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setLinkOpen(false)
      setNotice({ text: 'Ссылка скопирована', at: Date.now() })
    } catch {
      // Без разрешения на буфер поле с ссылкой и так открыто: скопирует руками.
      setNotice({ text: 'Скопируйте ссылку из поля', at: Date.now() })
    }
  }

  const publish = async (anonymize: boolean) => {
    setBusy(true)
    const result = await shareSeason(code, anonymize)
    setBusy(false)
    setPublishOpen(false)
    if (result.code) {
      // Пометка нужна витрине, чтобы объяснить, что случилось: выложили сейчас
      // или такой сезон там уже был. Свой адрес страница потом почистит.
      location.assign(`${publicSeasonHref(result.code)}?published=${result.fresh ? 'new' : 'again'}`)
      return
    }
    setNotice({
      text: PUBLISH_TEXT[result.status as 'duplicate' | 'limit' | 'stale' | 'error'],
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label="Действия с сезоном">
        <span className={styles.hint}>
          {editing ? 'Сохраняется само' : 'Ваш сезон'}
        </span>
        <span className={styles.actions}>
          {/* Заливка — на переключателе режима, и в просмотре тоже: в ряду она
              одна и с кнопки на кнопку не переезжает (см. `Bar.module.css`). */}
          <Link
            className={styles.primary}
            href={seasonHref(code, editing ? 'view' : 'edit')}
          >
            {editing ? 'Готово' : 'Править'}
          </Link>
          {!editing && (
            <>
              <button
                type="button"
                className={styles.ghost}
                disabled={busy}
                onClick={() => setForkOpen(true)}
              >
                Форкнуть
              </button>
              {/* Личная ссылка — «показать», витрина — «выложить». Рядом стоят
                  намеренно: это два разных способа показать сезон, и выбирать
                  между ними человек должен, видя оба. */}
              <button
                type="button"
                className={styles.icon}
                disabled={busy}
                aria-pressed={Boolean(link)}
                onClick={() => setLinkOpen(true)}
                title={link ? 'Личная ссылка выдана' : 'Показать по личной ссылке'}
                aria-label={link ? 'Личная ссылка выдана' : 'Показать по личной ссылке'}
              >
                <LinkDoodle size={19} strokeWidth={3.4} />
              </button>
              <button
                type="button"
                className={styles.icon}
                disabled={busy}
                onClick={() => setPublishOpen(true)}
                title="Выложить на витрину сообщества"
                aria-label="Выложить на витрину сообщества"
              >
                <MegaphoneDoodle size={19} strokeWidth={4} />
              </button>
            </>
          )}
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

      {forkOpen && (
        <NewSeasonDialog
          heading="Форкнуть сезон"
          initialTitle={defaultSeasonTitle(template)}
          busy={busy}
          onDismiss={() => setForkOpen(false)}
          onSubmit={(title) => void fork(title)}
        />
      )}
      {linkOpen && (
        <ShareLinkDialog
          token={link}
          busy={busy}
          onDismiss={() => setLinkOpen(false)}
          onIssue={() => void issueLink()}
          onRevoke={() => void dropLink()}
          onCopy={(url) => void copyLink(url)}
        />
      )}
      {publishOpen && (
        <PublishDialog
          busy={busy}
          onDismiss={() => setPublishOpen(false)}
          onSubmit={(anonymize) => void publish(anonymize)}
        />
      )}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
