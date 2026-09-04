'use client'

import { useEffect, useState } from 'react'
import {
  FlagDoodle,
  LinkDoodle,
  MegaphoneDoodle,
  PrinterDoodle,
  SparkStar,
} from '../../../../components/doodles'
import { LikeCount } from '../../../../components/community/LikeCount'
import { ForkButton } from '../../../../components/edit/ForkButton'
import { LoginDialog } from '../../../../components/edit/LoginDialog'
import { ReportDialog } from '../../../../components/edit/ReportDialog'
import { WithdrawDialog } from '../../../../components/edit/WithdrawDialog'
import { Toast } from '../../../../components/site/Toast'
import { useDict, useLang } from '../../../../i18n/context'
import { fill } from '../../../../i18n/fill'
import {
  publishText,
  reactionText,
  type LoginReason,
  type ReactionStatus,
} from '../../../../model/community'
import { ideaTitle } from '../../../../model/library'
import { ROUTES, withLang } from '../../../../model/site'
import {
  favoriteSeason,
  likeSeason,
  reportSeason,
  republishSeason,
  withdrawSeason,
} from '../../../../server/actions'
import { useDoc } from '../../../../state/docContext'
import styles from '../../../../components/edit/Bar.module.css'

/** Толщина обводки рисунков из библиотеки в размере кнопки — см. `Icon`. */
const ICON_STROKE = 4

/**
 * Про лайк и звёздочку вход заранее не спрашивается: действие уходит на сервер,
 * и `anonymous` в ответе открывает окно входа. У жалобы иначе — её окно просит
 * написать текст, и заставлять человека сочинять жалобу, чтобы в ответ услышать
 * «сначала войдите», нельзя.
 *
 * Языков здесь два: название сезона выводится из содержимого языком сезона,
 * кнопки и окна говорят языком интерфейса.
 */
export function PublicBar({
  code,
  demo,
  signedIn,
  mine,
  system,
  hidden,
  published,
  state,
}: {
  code: string
  demo: boolean
  signedIn: boolean
  mine: boolean
  /** Ничей системный сезон — наш пример: на такой не жалуются. */
  system: boolean
  hidden: boolean
  /** Пришли сюда прямо с публикации: `new` — выложили сейчас, `again` — уже лежал. */
  published: 'new' | 'again' | null
  state: { likes: number; liked: boolean; reported: boolean; favorited: boolean }
}) {
  // Название берётся из содержимого: колонки `title` у публикации нет вовсе.
  const { template, lang } = useDoc()
  const uiLang = useLang()
  const { bars } = useDict()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  /** Окно входа помнит, ради чего его открыли: слова у трёх кнопок разные. */
  const [login, setLogin] = useState<LoginReason | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)
  // Ответ известен из самого действия: переспрашивать сервер незачем.
  const [marks, setMarks] = useState(state)

  /*
   * Пометка нужна один раз: дальше она мешала бы — этот адрес копируют и
   * отправляют. `history.state` в `replaceState` передаём обязательно, иначе
   * вызов пойдёт через `ACTION_RESTORE` и постер перемонтируется (см. «Каркас»).
   */
  useEffect(() => {
    if (!published) return
    const url = new URL(location.href)
    url.searchParams.delete('published')
    history.replaceState(history.state, '', url.pathname + url.search)
  }, [published])

  /** «Войдите» — не отказ сервера, а предложение: его показывает окно, не тост. */
  const react = (status: ReactionStatus, reason: LoginReason) => {
    if (status === 'anonymous') setLogin(reason)
    else if (status !== 'ok') setNotice({ text: reactionText(uiLang, status), at: Date.now() })
    return status === 'ok'
  }

  const switchFavorite = async () => {
    if (busy) return
    const on = !marks.favorited
    setBusy(true)
    const status = await favoriteSeason(code, on)
    setBusy(false)
    if (react(status, 'favorite')) setMarks({ ...marks, favorited: on })
  }

  const switchLike = async () => {
    if (busy) return
    const on = !marks.liked
    setBusy(true)
    const status = await likeSeason(code, on)
    setBusy(false)
    if (react(status, 'like')) setMarks({ ...marks, liked: on, likes: marks.likes + (on ? 1 : -1) })
  }

  // Окно закрываем при любом исходе: два модальных окна друг на друге — не разговор.
  const sendReport = async (comment: string) => {
    setBusy(true)
    const status = await reportSeason(code, comment)
    setBusy(false)
    setReportOpen(false)
    if (!react(status, 'report')) return
    setMarks({ ...marks, reported: true })
    setNotice({ text: bars.reportDone, at: Date.now() })
  }

  const copyLink = async () => {
    // Ровно то, что в адресной строке: код плюс примеренное оформление.
    const url = location.href
    try {
      await navigator.clipboard.writeText(url)
      setNotice({ text: bars.linkCopied, at: Date.now() })
    } catch {
      prompt(bars.linkPrompt, url)
    }
  }

  const withdraw = async () => {
    setBusy(true)
    const result = await withdrawSeason(code)
    setBusy(false)
    setWithdrawOpen(false)
    if (result.status !== 'ok') {
      setNotice({
        text: publishText(uiLang, result.status as 'duplicate' | 'limit' | 'stale' | 'error'),
        at: Date.now(),
      })
      return
    }
    // Осталась скрытой — перечитываем; ушла совсем — открывать больше нечего.
    if (result.hidden) location.reload()
    else location.assign(withLang(uiLang, ROUTES.seasons))
  }

  // Возврат окна не просит: терять нечего, строка та же самая.
  const republish = async () => {
    setBusy(true)
    const status = await republishSeason(code)
    setBusy(false)
    if (status === 'ok') {
      location.reload()
      return
    }
    setNotice({
      text: publishText(uiLang, status as 'duplicate' | 'limit' | 'stale' | 'error'),
      at: Date.now(),
    })
  }

  return (
    <>
      <div className={styles.bar} role="toolbar" aria-label={bars.toolbarAria}>
        {/* Своё не откладывают: избранное держало бы свою публикацию от снятия. */}
        {!mine && (
          <>
            <button
              type="button"
              className={styles.icon}
              onClick={() => void switchFavorite()}
              disabled={busy}
              aria-pressed={marks.favorited}
              title={marks.favorited ? bars.favoriteOff : bars.favoriteOn}
              aria-label={marks.favorited ? bars.favoriteOff : bars.favoriteOn}
            >
              <SparkStar size={18} filled={marks.favorited} />
            </button>
            {/* Число внутри кнопки: за рамкой оно читалось как подпись
                неизвестно к чему. */}
            <button
              type="button"
              className={marks.likes > 0 ? `${styles.icon} ${styles.withCount}` : styles.icon}
              onClick={() => void switchLike()}
              disabled={busy}
              aria-pressed={marks.liked}
              title={marks.liked ? bars.likeOff : bars.likeOn}
              aria-label={
                marks.likes > 0
                  ? fill(bars.likeAriaCount, {
                      action: marks.liked ? bars.likeOff : bars.likeOn,
                      n: marks.likes,
                    })
                  : marks.liked
                    ? bars.likeOff
                    : bars.likeOn
              }
            >
              <LikeCount
                likes={marks.likes}
                filled={marks.liked}
                hideZero
                label={fill(bars.likesAria, { n: marks.likes })}
              />
            </button>
            {/* На наши примеры не жалуются: шестеро недовольных убрали бы их с витрины. */}
            {!system && (
              <button
                type="button"
                className={styles.icon}
                onClick={() => (signedIn ? setReportOpen(true) : setLogin('report'))}
                disabled={busy}
                aria-pressed={marks.reported}
                title={marks.reported ? bars.reportDone : bars.reportOpen}
                aria-label={marks.reported ? bars.reportDone : bars.reportOpen}
              >
                <FlagDoodle size={18} filled={marks.reported} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </>
        )}

        {/* Читалка, а не погашенная кнопка: погашенная обещала бы, что
            когда-нибудь станет доступной, — а она не станет никогда. */}
        {mine && (
          <LikeCount
            likes={marks.likes}
            label={fill(bars.likesOnShowcase, { n: marks.likes })}
            className={styles.score}
          />
        )}

        {/* У снятого с витрины места нет — остаётся одно название. */}
        <span className={styles.hint}>
          {hidden
            ? ideaTitle(template, lang)
            : fill(bars.withTitle, {
                place: demo ? bars.placeExample : bars.placePublic,
                title: ideaTitle(template, lang),
              })}
        </span>

        <span className={styles.actions}>
          <ForkButton
            signedIn={signedIn}
            from={code}
            onFailure={(text) => setNotice({ text, at: Date.now() })}
          />
          {/* Кнопка нажата (`aria-pressed`), пока сезон на витрине, и снимает
              его; отжатая возвращает обратно. */}
          {mine && (
            <button
              type="button"
              className={styles.icon}
              disabled={busy}
              aria-pressed={!hidden}
              onClick={() => (hidden ? void republish() : setWithdrawOpen(true))}
              title={hidden ? bars.republish : bars.withdraw}
              aria-label={hidden ? bars.republish : bars.withdraw}
            >
              <MegaphoneDoodle size={19} strokeWidth={ICON_STROKE} />
            </button>
          )}
          <button
            type="button"
            className={styles.icon}
            onClick={() => void copyLink()}
            title={bars.copyLink}
            aria-label={bars.copyLink}
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

      {/* Окна и тост — вне бара: у `.bar` есть `backdrop-filter`, а он делает
          элемент содержащим блоком для `position: fixed`. */}
      {withdrawOpen && (
        <WithdrawDialog
          busy={busy}
          onDismiss={() => setWithdrawOpen(false)}
          onSubmit={() => void withdraw()}
        />
      )}
      {reportOpen && (
        <ReportDialog
          busy={busy}
          sent={marks.reported}
          onDismiss={() => setReportOpen(false)}
          onSubmit={(comment) => void sendReport(comment)}
        />
      )}
      {login && <LoginDialog reason={login} onClose={() => setLogin(null)} />}
      {published && <Toast message={published === 'new' ? bars.published : bars.publishedAgain} />}
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
