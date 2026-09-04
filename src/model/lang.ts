/**
 * Файл намеренно без зависимостей — ни серверных, ни клиентских: его читают и
 * `src/proxy.ts` (в среде Edge), и словарь, и модель, и скрипты посева.
 */

export const LANGS = ['ru', 'en', 'pl'] as const

export type Lang = (typeof LANGS)[number]

export const DEFAULT_LANG: Lang = 'ru'

/**
 * Подпись языка — на нём самом: переключатель читает тот, кто нужного языка ещё
 * не видит, и «польский» ему не поможет, а `Polski` — поможет. Поэтому подписи
 * и не едут в словарь.
 */
export const LANG_LABELS: Record<Lang, string> = {
  ru: 'Русский',
  en: 'English',
  pl: 'Polski',
}

/**
 * `null` вместо подмены нужен `proxy`: «языка в пути нет» и «в пути стоит
 * русский» — разные случаи, во втором редиректа быть не должно.
 */
export function langOrNull(value: unknown): Lang | null {
  return LANGS.includes(value as Lang) ? (value as Lang) : null
}

/** То же, но там, где язык есть всегда: сегмент адреса, колонка в базе. */
export function knownLang(value: unknown): Lang {
  return langOrNull(value) ?? DEFAULT_LANG
}

/**
 * Язык из `Accept-Language`. Разбираем руками: три языка и десяток строк —
 * ради этого тащить `negotiator` с `intl-localematcher` в прокси незачем.
 *
 * `q` учитываем, регион отбрасываем (`pl-PL` → `pl`), незнакомые языки
 * пропускаем: у человека в списке может стоять пять языков, и подходящим
 * окажется третий. Не нашли ни одного — `null`, решает вызывающий.
 */
export function langFromAccept(header: string | null | undefined): Lang | null {
  if (!header) return null

  const wanted = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q ? Number.parseFloat(q.slice(2)) : 1
      return {
        tag: tag.trim().toLowerCase().split('-')[0],
        weight: Number.isFinite(weight) ? weight : 0,
      }
    })
    // При равных весах побеждает стоящий раньше: `Array#sort` в ES2019 устойчив.
    .sort((a, b) => b.weight - a.weight)

  for (const { tag, weight } of wanted) {
    if (weight <= 0) continue
    const lang = langOrNull(tag)
    if (lang) return lang
  }
  return null
}

export const LANG_COOKIE = 'fs-lang'

/** Год: язык выбирают один раз, и переспрашивать его каждый месяц незачем. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Язык, стоявший в запрошенном адресе (`url`), сильнее настройки из базы, а
 * подставленный самим `proxy` (`auto`) — слабее. Различить их по одному адресу
 * нельзя: после редиректа язык стоит в пути ровно так же, как набранный руками.
 */
export type LangSource = 'url' | 'auto'

export const LANG_SOURCE_HEADER = 'x-lang-source'

/**
 * Пометка «язык подставил я сам», живущая ровно один переход. Без неё настройка
 * из базы не побеждала бы никогда: заход на голый `/` приходил бы в лейаут
 * неотличимым от адреса, набранного руками.
 */
export const LANG_AUTO_COOKIE = 'fs-lang-auto'

/**
 * Путь без языка вместе с query: серверному компоненту свой адрес ниоткуда не
 * виден, а увести на тот же адрес в другом языке надо. Query обязателен — в нём
 * живёт примеренное оформление, и редирект, теряющий его, портит ту самую
 * ссылку, ради которой примерка и заведена.
 */
export const LANG_PATH_HEADER = 'x-lang-path'
