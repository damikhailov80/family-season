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
 * Панель выложенного сезона.
 *
 * Кнопки стоят по двум краям, и это два разных края. Слева, до подсказки, — то,
 * что делают с этим постером **у себя**: звёздочка, лайк, жалоба. Справа — то,
 * что уносит его наружу: ссылка и печать. Форк посередине, в общем ряду
 * действий: он не про этот сезон, а про следующий, свой.
 *
 * Про лайк и звёздочку вход, в отличие от форка, не спрашивается заранее: действие уходит на
 * сервер, и `anonymous` в ответе открывает окно входа. Это не отказ, а
 * предложение, и оттого показывает его окно, а не тост. У жалобы иначе: её
 * окно просит **написать текст**, и заставлять человека сочинять жалобу, чтобы
 * в ответ услышать «сначала войдите», нельзя — там вход спрошен заранее.
 *
 * Окно входа одно, но разговор у каждой кнопки свой: причина едет в него
 * состоянием (`login`), а слова — в словаре (`status.login`).
 *
 * Языков здесь два. Подсказка называет сезон его собственным названием, и оно
 * выводится из содержимого языком **сезона**; всё остальное — кнопки, окна,
 * тосты — говорит языком интерфейса. Прямая ссылка открывается из любого языка,
 * и русский сезон в польском интерфейсе — обычное дело.
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
  /** Это моя публикация: её можно убрать с витрины, но не лайкать. */
  mine: boolean
  /** Ничей системный сезон — наш пример: на такой не жалуются. */
  system: boolean
  /** Снята с витрины, но живёт по ссылке. */
  hidden: boolean
  /** Пришли сюда прямо с публикации: `new` — выложили сейчас, `again` — уже лежал. */
  published: 'new' | 'again' | null
  /** Что этот сезон уже собрал и что с ним сделал сам смотрящий. */
  state: { likes: number; liked: boolean; reported: boolean; favorited: boolean }
}) {
  // Название берётся из содержимого, а не из строки: колонка рядом была бы
  // второй копией того, что уже лежит в `content`.
  const { template, lang } = useDoc()
  const uiLang = useLang()
  const { bars } = useDict()
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  /** Открытое окно входа помнит, ради чего его открыли: слова у трёх кнопок разные. */
  const [login, setLogin] = useState<LoginReason | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)
  /**
   * Ответ сервера уже известен из самого действия — переспрашивать его незачем,
   * поэтому состояние кнопок живёт здесь, начавшись с пришедшего со страницы.
   */
  const [marks, setMarks] = useState(state)

  /*
   * Пометка о публикации нужна ровно один раз — объяснить, почему человек тут
   * оказался. Дальше она только мешала бы: этот адрес копируют и отправляют.
   * Чистим `replaceState`-ом, как кабинет чистит свой `?ok=1`; `history.state`
   * передаём обязательно (см. «Каркас»).
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

  /** Окно закрываем при любом исходе: два модальных окна друг на друге — не разговор. */
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
    // Ровно то, что в адресной строке: короткий код плюс примеренное оформление,
    // если его меняли. Собирать адрес заново здесь нечего — он уже собран.
    const url = location.href
    try {
      await navigator.clipboard.writeText(url)
      setNotice({ text: bars.linkCopied, at: Date.now() })
    } catch {
      // Без разрешения на буфер — показываем ссылку, скопирует руками.
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
    // Осталась скрытой — страница по-прежнему открывается, и её надо перечитать;
    // ушла совсем — открывать больше нечего, уводим в кабинет.
    if (result.hidden) location.reload()
    else location.assign(withLang(uiLang, ROUTES.seasons))
  }

  /*
   * Возврат на витрину окна не просит: терять нечего, и строка та же самая.
   * Подтверждают только снятие — там сезон может исчезнуть совсем.
   */
  const republish = async () => {
    setBusy(true)
    const status = await republishSeason(code)
    setBusy(false)
    if (status === 'ok') {
      // Подсказка ряда снова назовёт место: перечитываем страницу целиком.
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
        {/* Своё не откладывают и не лайкают: оно и так лежит в кабинете, а
            избранное вдобавок держало бы собственную публикацию от снятия. */}
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
            {/* Число живёт **внутри** кнопки, в её же рамке: за рамкой оно
                читалось как подпись неизвестно к чему. Само сердце со счётом —
                общий `LikeCount`, он же прячет ноль. */}
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
            {/* На наши примеры не жалуются: шестеро недовольных иначе убрали бы
                их с витрины. */}
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

        {/* Свой выложенный сезон: счёт лайков видно, а нажать нечего. Это
            **читалка, а не погашенная кнопка**: погашенная обещала бы, что
            когда-нибудь станет доступной, — а она не станет никогда. */}
        {mine && (
          <LikeCount
            likes={marks.likes}
            label={fill(bars.likesOnShowcase, { n: marks.likes })}
            className={styles.score}
          />
        )}

        {/* Имя места и название сезона — и ничего больше: человеку важно, где он
            оказался и что перед ним, а не как сезон сюда попал. У снятого с
            витрины места нет — остаётся одно название. */}
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
          {/* Распоряжается витриной только тот, кто выложил, — и в обе стороны:
              кнопка нажата (`aria-pressed`), пока сезон на витрине, и снимает
              его; отжатая возвращает обратно. Погашенной она была, пока вернуть
              снятое было нечем: сезон оказывался в тупике, из которого его
              выводила только повторная публикация из личного сезона. */}
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
