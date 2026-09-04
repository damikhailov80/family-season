import { LIBRARY_LIMIT, type LibraryStatus } from './library'
import type { Lang } from './lang'
import { DICTS } from '../i18n/dict'
import { fill } from '../i18n/fill'

/**
 * Число своё, а не `LIBRARY_LIMIT`: коллекция — склад, и сто строк в ней никому
 * не мешают, а витрина — общая полка. Считается видимое: снятое место не
 * занимает, иначе слова «уберите лишние с витрины» были бы неправдой.
 */
export const PUBLISH_LIMIT = 5

/**
 * Порог внимания, а не автоматическое действие: витрина ничего не прячет сама,
 * закрывает сезон человек через `npm run db:reports`. Считаются авторы жалоб, а
 * не нажатия: повторная жалоба прежнюю заменяет.
 */
export const REPORTS_TO_REVIEW = 5

export const IDEAS_PAGE = 10

/** `duplicate` разведён с `error`: человеку понятно, что случилось, и есть что чинить. */
export type PublishStatus = LibraryStatus | 'duplicate' | 'blocked'

/** `anonymous` сюда не попадает: до кнопки публикации доходит только вошедший. */
export function publishText(
  lang: Lang,
  status: Exclude<PublishStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.publish[status]
  return status === 'limit' ? fill(text, { n: PUBLISH_LIMIT }) : text
}

/** `own` разведён с `error`: «это ваш собственный сезон» — не беда сервера. */
export type ReactionStatus = LibraryStatus | 'own' | 'blocked'

export function reactionText(
  lang: Lang,
  status: Exclude<ReactionStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.reaction[status]
  return status === 'limit' ? fill(text, { n: LIBRARY_LIMIT }) : text
}

/** Не бюджет бумаги, как у полей постера, а мера жанра: жалоба — не письмо. */
export const COMMENT_LIMIT = 300

/** Пустой — `null`: жалоба без слов бесполезна тому, кто будет в ней разбираться. */
export function normalizeComment(input: unknown): string | null {
  if (typeof input !== 'string') return null
  return input.replace(/\s+/g, ' ').trim().slice(0, COMMENT_LIMIT) || null
}

/** Заголовок у окна входа общий, меняется фраза под ним: она называет нажатое. */
export type LoginReason = 'favorite' | 'like' | 'report'

export function loginText(lang: Lang, reason: LoginReason): string {
  return DICTS[lang].status.login[reason]
}
