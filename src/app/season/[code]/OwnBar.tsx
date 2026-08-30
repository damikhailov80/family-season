'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { LinkDoodle, MegaphoneDoodle, PrinterDoodle } from '../../../components/doodles'
import { NewSeasonDialog } from '../../../components/edit/NewSeasonDialog'
import { PublishDialog } from '../../../components/edit/PublishDialog'
import { RenameDialog } from '../../../components/edit/RenameDialog'
import { ShareLinkDialog } from '../../../components/edit/ShareLinkDialog'
import { Toast } from '../../../components/site/Toast'
import { PUBLISH_TEXT, type PublishStatus } from '../../../model/community'
import { defaultSeasonTitle, LIBRARY_TEXT, normalizeTitle } from '../../../model/library'
import { publicSeasonHref, seasonHref } from '../../../model/site'
import {
  previewShare,
  renameSeason,
  revokeLink,
  shareLink,
  shareSeason,
  storeSeason,
} from '../../../server/actions'
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
 *
 * **Состояния у мегафона нет: он всегда обычная кнопка.** Отвечает на вопрос
 * «а такой сезон уже выложен?» окно, и отвечает в тот миг, когда открывается
 * (`previewPublish`), — сценария там ровно два: выложить или «такой уже есть», и
 * тогда со ссылкой. Нажатость кнопки была третьим ответом на тот же вопрос и
 * стоила запроса к базе на каждый показ страницы: витрину приходилось спрашивать
 * до того, как человек ею заинтересовался. Хуже того, ответ этот был неполным —
 * чужих публикаций того же содержимого он не искал вовсе.
 */
export function OwnBar({
  code,
  editing,
  title,
  token,
}: {
  code: string
  editing: boolean
  /** Название строки — то же, что в списке «Мои сезоны». */
  title: string
  /** Токен приватной ссылки; `null` — её не выдавали. */
  token: string | null
}) {
  const { template, palette, iconSet } = useDoc()
  const [forkOpen, setForkOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  /** Что витрина ответит на «Выложить»; `null` — ещё спрашиваем. */
  const [check, setCheck] = useState<{ status: PublishStatus; code?: string } | null>(null)
  /** Номер проверки: ответ на закрытое окно не должен попасть в следующее. */
  const checkRun = useRef(0)
  const [linkOpen, setLinkOpen] = useState(false)
  // Ответ известен из самого действия — переспрашивать сервер незачем.
  const [link, setLink] = useState(token)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)
  // Ответ известен из самого действия: страница не перерисовывается, имя в ряду
  // меняем сами. На неудаче остаётся прежнее.
  const [name, setName] = useState(title)
  const [renameOpen, setRenameOpen] = useState(false)

  const rename = async (next: string) => {
    const clean = normalizeTitle(next, name)
    setBusy(true)
    const status = clean === name ? 'ok' : await renameSeason(code, clean)
    setBusy(false)
    setRenameOpen(false)
    if (status === 'ok') {
      setName(clean)
      return
    }
    setNotice({ text: LIBRARY_TEXT[status as 'limit' | 'stale' | 'error'], at: Date.now() })
  }

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

  /*
   * Окно открывается сразу, а витрину спрашиваем следом: ждать ответа с закрытым
   * окном — значит на секунду оставить нажатие без всякого следа.
   */
  const openPublish = () => {
    const run = ++checkRun.current
    setCheck(null)
    setPublishOpen(true)
    void previewShare(code).then((result) => {
      if (checkRun.current === run) setCheck(result)
    })
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
        {/* Название — то самое, что стоит в списке: колонка `title`. В правке
            по нему нажимают и переименовывают окном; поле прямо в ряду росло
            вместе с набранным и дёргало кнопки на каждом знаке. */}
        {editing ? (
          <button
            type="button"
            className={`${styles.hint} ${styles.rename}`}
            onClick={() => setRenameOpen(true)}
            title="Переименовать сезон"
          >
            Ваш сезон: {name}
          </button>
        ) : (
          <span className={styles.hint}>Ваш сезон: {name}</span>
        )}
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
                onClick={openPublish}
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
          onDismiss={() => setPublishOpen(false)}
          onSubmit={(anonymize) => void publish(anonymize)}
        />
      )}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
