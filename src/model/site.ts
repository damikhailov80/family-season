import { QR_URL } from './qr.data'
import { langOrNull, type Lang } from './lang'
import type { IconSetId, PaletteId } from '../types'

/**
 * Адреса и контакты сайта вокруг листа. Собраны в одном месте, чтобы почта и
 * маршруты не расползались по разметке шапки, подвала и лендинга.
 */

export const CONTACT_EMAIL = 'smart.scriptorium+familyseason.online@gmail.com'

/**
 * Адрес сайта — там, где ссылка должна быть абсолютной и не зависеть от того,
 * откуда открыт лист: сейчас это QR на постере, распечатку читают вне браузера.
 *
 * Значение приходит из `tools/qr/source.json` через собранный `qr.data.ts`, а не
 * объявлено здесь: код собран ровно из этой строки, и вторая копия адреса рано
 * или поздно разойдётся с ней — QR молча поведёт не туда.
 */
export const SITE_URL = QR_URL

/**
 * Пути **без языка**. Язык приписывает `withLang`, а не сама таблица: путь один
 * и тот же на всех трёх языках, и держать по три копии каждого адреса значило
 * бы поссорить их при первой же правке.
 */
export const ROUTES = {
  home: '/',
  /** Черновик невошедшего в просмотре; содержимое — в `localStorage`. */
  sheet: '/sheet',
  /** Тот же черновик в правке. Ничего в браузере нет — пустой бланк «с нуля». */
  sheetEdit: '/sheet/edit',
  seasons: '/seasons',
  /** Витрина сезонов, которыми поделились семьи. */
  ideas: '/ideas',
  /** Корень постоянных адресов выложенных сезонов: `/s/<code>`. */
  publicSeason: '/s',
  /** Корень адресов своих сезонов: `/season/<code>` и `/season/<code>/edit`. */
  season: '/season',
  /** Корень приватных ссылок на свой сезон: `/p/<token>`. */
  shared: '/p',
  /** Личный кабинет: настройки и выход. Только для вошедших. */
  account: '/account',
  /** Политика приватности: её адрес требует Google для публикации входа. */
  privacy: '/privacy',
} as const

/**
 * Адрес с языком: `/ru/seasons`, `/en/`, `/pl/s/abc123`.
 *
 * Язык стоит в адресе всегда, включая русский. Так адрес одинаково устроен на
 * всех трёх языках, присланная ссылка открывается ровно тем, чем её видел
 * отправитель, и `[lang]` остаётся **корневым параметром** — иначе
 * `next/root-params` не работает вовсе.
 */
export function withLang(lang: Lang, path: string): string {
  return path === ROUTES.home ? `/${lang}` : `/${lang}${path}`
}

/**
 * Отрезать язык от пути: `/pl/sheet/edit` → `/sheet/edit`.
 *
 * Нужно там, где путь сравнивают с `ROUTES` или переносят в другой язык. Если
 * первого сегмента-языка нет, путь возвращается как есть: так функция годится и
 * для адреса, который до `proxy` ещё не дошёл.
 */
export function stripLang(pathname: string): string {
  const [, first, ...rest] = pathname.split('/')
  return langOrNull(first) ? `/${rest.join('/')}` : pathname
}

/**
 * Режим листа несёт путь, а не пометка в хэше: адрес правки можно сохранить,
 * переслать и перезагрузить. Тип берём голым union'ом — `model` не должен
 * зависеть от `state`, а `DocMode` объявлен там.
 *
 * Путь передают обязательно, и брать его надо у роутера (`usePathname`), а не из
 * `location`: при мягком переходе адрес в `location` меняется уже после рендера,
 * и умолчание отдавало бы прежний режим.
 */
export function modeFromPath(pathname: string): 'view' | 'edit' {
  // Хвостовой слэш Next убирает редиректом, но сравнение путей не должно от этого зависеть.
  return stripLang(pathname).replace(/\/+$/, '') === ROUTES.sheetEdit ? 'edit' : 'view'
}


/**
 * Постоянный адрес выложенного сезона. Код — перестановка id строки
 * (`src/model/shortcode.ts`), поэтому адрес считается и без похода в базу:
 * у наших примеров id известны заранее.
 *
 * Оформление дописывается перебивкой: `?p=<тема>&i=<набор рисунков>`. Тема и
 * рисунки не часть бланка, в строке лежит своё — но примерившему чужой сезон
 * в другой теме надо уметь послать ссылку на то, что он видит. Пометки те же
 * `p=` и `i=`, что раньше жили в хэше, и по той же причине: оформление меняют
 * чаще всего и хотят видеть его в адресе.
 *
 * В query, а не в хэше: хэш до сервера не доходит, и присланная ссылка
 * открылась бы сперва в теме из базы, а потом перекрасилась.
 */
export function publicSeasonHref(
  lang: Lang,
  code: string,
  decor?: { palette: PaletteId; iconSet: IconSetId },
): string {
  const address = withLang(lang, `${ROUTES.publicSeason}/${code}`)
  return decor ? `${address}?p=${decor.palette}&i=${decor.iconSet}` : address
}

/**
 * Адрес своего сезона. Режим по-прежнему несёт путь, а не пометка: адрес правки
 * можно сохранить, переслать себе и перезагрузить.
 *
 * Открывается он только владельцем, поэтому короткий код здесь не секрет и не
 * пропуск: строка ищется вместе с аккаунтом.
 */
export function seasonHref(lang: Lang, code: string, mode: 'view' | 'edit' = 'view'): string {
  const address = `${ROUTES.season}/${code}${mode === 'edit' ? '/edit' : ''}`
  return withLang(lang, address)
}

/**
 * Приватная ссылка на свой сезон. Токен случайный, а не выведенный из id: его
 * отзывают и выдают заново (`src/model/shortcode.ts`).
 */
export function sharedHref(lang: Lang, token: string): string {
  return withLang(lang, `${ROUTES.shared}/${token}`)
}

/**
 * Черновик невошедшего: просмотр и правка — разные адреса, как и у своего сезона.
 */
export function sheetHref(lang: Lang, mode: 'view' | 'edit' = 'view'): string {
  return withLang(lang, mode === 'edit' ? ROUTES.sheetEdit : ROUTES.sheet)
}
