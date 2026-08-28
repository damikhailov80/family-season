import { useEffect, useState } from 'react'
import { COMMUNITY_TEXT, type CommunityStatus } from '../../model/community'
import {
  defaultSeasonTitle,
  LIBRARY_LIMIT,
  normalizeTitle,
  type LibraryStatus,
} from '../../model/library'
import {
  likeSeason,
  reportSeason,
  storeSeason,
  toggleFavorite,
  togglePublish,
} from '../../server/actions'
import { useDoc } from '../../state/docContext'
import { useLibrary, useSeasonUrl } from '../../state/useLibrary'
import {
  FlagDoodle,
  HeartDoodle,
  LinkDoodle,
  MegaphoneDoodle,
  PrinterDoodle,
  SparkStar,
} from '../doodles'
import { Toast } from '../site/Toast'
import { LoginDialog } from './LoginDialog'
import { ReportDialog } from './ReportDialog'
import { SaveSeasonDialog, type SaveVariant } from './SaveSeasonDialog'
import styles from './Toolbar.module.css'

/** Толщина обводки рисунков из библиотеки в размере кнопки — см. `Icon`. */
const ICON_STROKE = 4

/**
 * Переходы между примером и своим листом — настоящие ссылки: клик с модификатором
 * или средней кнопкой должен открывать лист в новой вкладке, как на любом сайте.
 * Обычный левый клик перехватываем — переход делается на месте, без перезагрузки.
 */
function onNavClick(action: () => void) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    action()
  }
}

/**
 * `anonymous` сюда не попадает: «войдите» — это не ошибка, а предложение, и
 * показывает его окно входа. Остальное — тост, единственный способ сообщать об
 * отказе сервера на всём сайте.
 */
const FAILURE_TEXT: Record<Exclude<LibraryStatus, 'ok' | 'anonymous'>, string> = {
  limit: `Больше ${LIBRARY_LIMIT} сезонов на аккаунт мы не храним — удалите лишние в «Моих сезонах».`,
  stale:
    'Не удалось сохранить: вход выполнен слишком давно. Обновите страницу и войдите заново.',
  error: 'Не удалось сохранить — ошибка на сервере. Попробуйте ещё раз.',
}

/**
 * Состояний у постера три — пример, свой сезон в просмотре и он же в правке, — и
 * тулбар собран по строкам их матрицы действий, а не вложенными тернарниками:
 * каждое условие ниже отвечает ровно за одно действие.
 *
 * Переключателя темы здесь нет: он доступен во всех трёх состояниях, ни от одного
 * из них не зависит и живёт отдельной плавающей кнопкой (`PaletteSwitcher`).
 *
 * Оба окна — входа и сохранения — рисуются отсюда же, потому что открыть их
 * может любая из кнопок, включая «Готово».
 */
export function Toolbar() {
  const {
    template,
    source,
    editing,
    seasonId,
    setSeasonId,
    setMode,
    fork,
    cancel,
    links,
    buildSeasonUrl,
    buildShareUrl,
  } = useDoc()

  /**
   * Адрес постера для библиотеки — им же помечен и ответ. Спрашиваем во всех трёх
   * состояниях, включая правку: звёздочка видна всегда, а от запроса на каждый
   * набранный символ спасает дебаунс внутри хука.
   */
  const seasonUrl = useSeasonUrl(buildSeasonUrl)
  const [{ favoriteId, season: stored, shared }, remember] = useLibrary(seasonUrl, seasonId)
  const [saveOpen, setSaveOpen] = useState<SaveVariant | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  /**
   * Всё, что тулбар сообщает человеку, идёт одним тостом — и удача, и отказ
   * сервера. Отметка времени нужна, чтобы одинаковое сообщение подряд
   * перемонтировало тост: без смены `key` он бы не показался второй раз.
   */
  const [notice, setNotice] = useState<{ text: string; at: number } | null>(null)
  const say = (text: string) => setNotice({ text, at: Date.now() })

  /*
   * Пометка `s=` в адресе и найденная строка держатся друг за друга:
   *  — пометка есть, а строки нет (чужой `s=`, сезон удалили) — стираем пометку,
   *    чтобы ссылка не возила указатель в никуда;
   *  — строка нашлась по адресу, а пометки нет (сезон открыли обычной ссылкой) —
   *    ставим её, и дальше «Сохранить» знает, что перезаписывает.
   * Только по определённому ответу: `undefined` значит «ещё не спросили».
   */
  useEffect(() => {
    if (seasonId && stored === null) setSeasonId(null)
    else if (!seasonId && stored) setSeasonId(stored.id)
  }, [seasonId, stored, setSeasonId])

  const copyLink = async () => {
    const url = await buildShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      say('Ссылка на сезон скопирована — можно отправлять')
    } catch {
      // Без разрешения на буфер — показываем ссылку, скопирует руками.
      prompt('Ссылка на лист:', url)
    }
  }

  /**
   * Полнота таблиц проверяется там, где они объявлены, поэтому здесь достаточно
   * знать, что это таблица: у библиотеки и у витрины наборы бед разные.
   */
  const report = (status: LibraryStatus | CommunityStatus, texts: Record<string, string>) => {
    // «Войдите» — не отказ сервера, а предложение: его показывает окно, не тост.
    if (status === 'anonymous') setLoginOpen(true)
    else if (status !== 'ok') say(texts[status])
  }

  const switchFavorite = async () => {
    if (busy) return
    setBusy(true)
    // Адрес пересобираем здесь, а не берём из `seasonUrl`: тот отстаёт на дебаунс,
    // и клик сразу после правки отложил бы допоследнюю версию постера.
    const url = await buildSeasonUrl()
    const result = await toggleFavorite(url, defaultSeasonTitle(template), favoriteId)
    setBusy(false)
    if (result.status !== 'ok') report(result.status, FAILURE_TEXT)
    else remember({ favoriteId: result.id ?? null })
  }

  /**
   * Выложить сезон на витрину или убрать его оттуда.
   *
   * Публикуется **строка** сохранённого сезона, а не адрес постера: название и
   * адрес витрина берёт из неё, поэтому переименование в кабинете видно сразу,
   * а удаление сезона уносит публикацию следом. Отсюда и условие доступности:
   * пока сезон не сохранён, публиковать нечего.
   */
  const switchPublish = async () => {
    if (busy || !stored) return
    const on = !shared?.mine
    setBusy(true)
    const result = await togglePublish(stored.id, on)
    setBusy(false)
    if (result.status !== 'ok') {
      report(result.status, COMMUNITY_TEXT)
      return
    }
    // Ответ известен из самого действия — переспрашивать сервер незачем.
    remember({
      shared: on
        ? { id: result.id, likes: 0, liked: false, reported: false, mine: true }
        : null,
    })
    say(on ? 'Сезон на витрине — он появился в «Идеях сообщества»' : 'Сезон убран с витрины')
  }

  /**
   * Лайк. Желаемое состояние уезжает на сервер целиком, а не «переключи там сам»:
   * так запрос идемпотентен и повторное нажатие в соседней вкладке не ломается.
   */
  const switchLike = async () => {
    if (busy || !shared) return
    const on = !shared.liked
    setBusy(true)
    const status = await likeSeason(shared.id, on)
    setBusy(false)
    if (status !== 'ok') {
      report(status, COMMUNITY_TEXT)
      return
    }
    remember({ shared: { ...shared, liked: on, likes: shared.likes + (on ? 1 : -1) } })
  }

  /**
   * Жалоба. Окно закрываем при любом исходе: на `anonymous` его место занимает
   * окно входа, а два модальных окна друг на друге — это уже не разговор.
   */
  const sendReport = async (comment: string) => {
    if (!shared) return
    setBusy(true)
    const status = await reportSeason(shared.id, comment)
    setBusy(false)
    setReportOpen(false)
    if (status !== 'ok') {
      report(status, COMMUNITY_TEXT)
      return
    }
    remember({ shared: { ...shared, reported: true } })
    say('Жалоба отправлена — спасибо, мы разберёмся')
  }

  /**
   * Сохранение — конец правки: сезон уехал в кабинет, править дальше нечего, и
   * человек оказывается там же, где после «Готово». Из просмотра всё то же самое,
   * только уходить некуда.
   */
  const store = async (title: string, overwrite: boolean) => {
    setBusy(true)
    const url = await buildSeasonUrl()
    const result = await storeSeason({ id: overwrite ? (stored?.id ?? seasonId) : null, url, title })
    setBusy(false)
    setSaveOpen(null)
    if (result.status !== 'ok') {
      report(result.status, FAILURE_TEXT)
      return
    }
    const id = result.id ?? null
    setSeasonId(id)
    remember({ season: id ? { id, title: normalizeTitle(title), url } : null })
    say('Сезон сохранён — он в «Моих сезонах»')
    if (editing) setMode('view')
  }

  /**
   * Пока библиотека не ответила, нажимать нечего: без адреса непонятно, **что**
   * сохранять, а без ответа про сезон — перезапись это или новая строка. Кнопка
   * в это время погашена; иначе в щель между загрузкой и ответом успевает
   * попасть клик и заводит вторую такую же строку.
   */
  const ready = Boolean(seasonUrl) && stored !== undefined

  /**
   * Выбор «перезаписать или новый» осмыслен только в правке: там постер и правда
   * мог стать другим сезоном. В просмотре бланк не меняли, поэтому там одно
   * действие — но окно всё равно есть: имя человек вправе поправить, а сохранение
   * молча, без подтверждения, слишком похоже на промах по кнопке.
   */
  const onSave = () => {
    if (!ready) return
    setSaveOpen(stored ? (editing ? 'choice' : 'update') : 'new')
  }

  /**
   * Кнопка показывает **состояние записи**, а не последнее действие: галочка стоит,
   * пока адрес постера совпадает с тем, что лежит в базе, и гаснет, едва постер
   * правят. Прежней отметки на две секунды здесь поэтому нет — всё остальное
   * время она врала.
   */
  const savedNow = Boolean(stored && seasonUrl && seasonUrl === stored.url)

  /**
   * Подсказка говорит про **лист**, а не про того, кто его открыл. «Ваш сезон»
   * здесь стояло с тех пор, когда постер попадал к человеку только из его же
   * рук; теперь ссылку раздаёт витрина, и слово заявляло бы авторство, которого
   * нет. Различать своё и чужое подсказка не может и не должна: ответ сервера
   * приходит позже первого рендера, и строка на глазах менялась бы.
   */
  const hint =
    source === 'demo'
      ? 'Это пример сезона — форкните его и перепишите под свою семью'
      : editing
        ? 'Правьте текст прямо на постере'
        : 'Этот сезон целиком лежит в ссылке'

  return (
    <>
      <div
        className={editing ? styles.bar : `${styles.bar} ${styles.withTools}`}
        role="toolbar"
        aria-label="Действия с листом"
      >
        {/* Звёздочка стоит первой и видна во всех трёх состояниях: избранное — это
            закладка в свой же кабинет, а не распространение постера, и от того,
            правят его сейчас или нет, она не зависит. Место постоянное, иначе
            подсказка рядом прыгала бы при каждом переходе. */}
        <button
          type="button"
          className={styles.icon}
          onClick={() => void switchFavorite()}
          disabled={busy}
          aria-pressed={!!favoriteId}
          title={favoriteId ? 'Убрать из избранного' : 'Добавить в избранное'}
          aria-label={favoriteId ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
          <SparkStar size={18} filled={!!favoriteId} />
        </button>

        {/* Свой выложенный сезон: счёт лайков видно, а нажать нечего. Это
            **читалка, а не погашенная кнопка**: погашенная обещала бы, что
            когда-нибудь станет доступной, — а она не станет никогда. Ноль
            показываем и здесь: для автора это его собственные данные и заодно
            признак, что сезон на витрине. */}
        {shared?.mine && (
          <span className={styles.score} role="img" aria-label={`Лайков на витрине: ${shared.likes}`}>
            <HeartDoodle size={18} filled strokeWidth={ICON_STROKE} />
            {shared.likes}
          </span>
        )}

        {/* Лайк и жалоба — только у **чужого** выложенного сезона: своё не
            лайкают и на своё не жалуются. Стоят рядом со звёздочкой, в том же
            ведущем ряду: они про этот постер и никуда его не уносят, в отличие
            от ссылки и печати. Кнопок нет и у невыложенного постера — жаловаться
            там некому и не на что. */}
        {shared && !shared.mine && (
          <>
            {/* Число живёт **внутри** кнопки, в её же рамке: за рамкой оно
                читалось как подпись неизвестно к чему. Ноль не показываем —
                пустой счёт у свежего сезона выглядел бы упрёком автору, — и
                кнопка тогда остаётся обычным квадратом. */}
            <button
              type="button"
              className={shared.likes > 0 ? `${styles.icon} ${styles.withCount}` : styles.icon}
              onClick={() => void switchLike()}
              disabled={busy}
              aria-pressed={shared.liked}
              title={shared.liked ? 'Убрать лайк' : 'Поставить лайк'}
              aria-label={`${shared.liked ? 'Убрать лайк' : 'Поставить лайк'}${
                shared.likes > 0 ? `, сейчас лайков: ${shared.likes}` : ''
              }`}
            >
              <HeartDoodle size={18} filled={shared.liked} strokeWidth={ICON_STROKE} />
              {/* Счёт уже назван в `aria-label` кнопки — читалке он второй раз
                  не нужен. */}
              {shared.likes > 0 && (
                <span className={styles.count} aria-hidden="true">
                  {shared.likes}
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.icon}
              onClick={() => setReportOpen(true)}
              disabled={busy}
              aria-pressed={shared.reported}
              title={shared.reported ? 'Жалоба отправлена — можно уточнить' : 'Пожаловаться'}
              aria-label={shared.reported ? 'Жалоба отправлена — можно уточнить' : 'Пожаловаться'}
            >
              <FlagDoodle size={18} filled={shared.reported} strokeWidth={ICON_STROKE} />
            </button>
          </>
        )}
        <span className={styles.hint}>{hint}</span>

        {/* Все действия над листом — один флекс-элемент, и это главное в раскладке
            ряда: не хватило места — вниз уезжает вся группа разом, а не последняя
            кнопка из неё. Печать при этом остаётся наверху: она вынута из потока
            и приколота к правому краю (см. `.group` в модуле). */}
        <div className={styles.actions}>
          {/* Из примера выходят только форком: правка на месте молча потеряла бы слой
              заполнения. У своего сезона форкать нечего — там это и есть «Править». */}
          {source === 'demo' ? (
            // href появляется после кодирования; обычный клик работает и без него.
            <a className={styles.primary} href={links.fork || undefined} onClick={onNavClick(fork)}>
              Форкнуть пример
            </a>
          ) : (
            <button
              type="button"
              className={editing ? styles.primary : styles.ghost}
              onClick={() => setMode(editing ? 'view' : 'edit')}
            >
              {editing ? 'Готово' : 'Править'}
            </button>
          )}
          {/* «Сохранить» — только у своего сезона: пример в «мои» не кладут, из него
              выходят форком, и уже форк сохраняют. Правку это действие, наоборот,
              не распространяет — сезон уезжает в свой же кабинет.

              Погашенная кнопка в просмотре и есть признак «этот адрес сохранён»:
              подпись не меняется, меняется доступность. В правке она активна
              всегда — там постер меняют, и сохранять есть что. */}
          {source === 'custom' && (
            <button
              type="button"
              className={styles.ghost}
              disabled={busy || !ready || (!editing && savedNow)}
              onClick={onSave}
              title={
                savedNow
                  ? 'Сезон сохранён, изменений с тех пор нет'
                  : 'Сохранить сезон в «Мои сезоны»'
              }
            >
              Сохранить
            </button>
          )}
          {/* «Отмена» — шаг назад по истории: к примеру, если пришли форком, к лендингу,
              если начали новый сезон. Она нужна, только пока правку можно отыграть: после
              «Готово» сезон сам по себе. Это <button>, а не ссылка, — у шага назад нет
              собственного адреса, открывать его в новой вкладке нечем. */}
          {source === 'custom' && editing && (
            <button type="button" className={styles.ghost} onClick={cancel}>
              Отмена
            </button>
          )}
        </div>

        {/*
          Ссылка и печать — отдельная группа у правого края верхней строки. Обе
          уносят постер за пределы экрана (в чужой браузер, на бумагу) и потому
          стоят вместе, а не в одном ряду с правкой и сохранением. Правящийся постер
          не распространяют — в правке этой группы нет вовсе; побочная выгода в том,
          что из просмотра ссылка заведомо свежая: дебаунс записи адреса уже отработал.
        */}
        {!editing && (
          <span className={styles.group}>
            {/* «Поделиться с сообществом» — самое «наружу» из всего ряда, поэтому
                стоит в этой группе и, как её соседи, пропадает в правке.

                Рисуется всегда, а не появляется: пока сезон не сохранён, кнопка
                погашена и объясняет себя подсказкой. Так ширина группы не зависит
                от состояния — а группа вынута из потока, и её скачки двигали бы
                весь верхний ряд. */}
            <button
              type="button"
              className={styles.icon}
              onClick={() => void switchPublish()}
              disabled={busy || !stored}
              aria-pressed={Boolean(shared?.mine)}
              title={
                !stored
                  ? 'Сначала сохраните сезон в «Мои» — витрина показывает сохранённое'
                  : shared?.mine
                    ? 'Убрать с витрины сообщества'
                    : 'Поделиться с сообществом'
              }
              aria-label={shared?.mine ? 'Убрать с витрины сообщества' : 'Поделиться с сообществом'}
            >
              <MegaphoneDoodle size={19} strokeWidth={ICON_STROKE} />
            </button>
            <button
              type="button"
              className={styles.icon}
              onClick={() => void copyLink()}
              title="Скопировать ссылку на сезон"
              aria-label="Скопировать ссылку на сезон"
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
        )}

      </div>

      {/*
        Окна и тост живут **вне** бара, и это не косметика: у `.bar` есть
        `backdrop-filter`, а он делает элемент содержащим блоком для
        `position: fixed` — тост внутри прилипал бы к тулбару вместо низа экрана.
      */}
      {saveOpen && (
        <SaveSeasonDialog
          variant={saveOpen}
          initialTitle={stored?.title ?? defaultSeasonTitle(template)}
          savedTitle={stored?.title ?? ''}
          busy={busy}
          onDismiss={() => setSaveOpen(null)}
          onSubmit={(title, overwrite) => void store(title, overwrite)}
        />
      )}
      {reportOpen && shared && (
        <ReportDialog
          busy={busy}
          sent={shared.reported}
          onDismiss={() => setReportOpen(false)}
          onSubmit={(comment) => void sendReport(comment)}
        />
      )}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      {notice && <Toast key={notice.at} message={notice.text} />}
    </>
  )
}
