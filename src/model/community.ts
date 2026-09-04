import { LIBRARY_LIMIT, type LibraryStatus } from './library'
import type { Lang } from './lang'
import { DICTS } from '../i18n/dict'
import { fill } from '../i18n/fill'

export const PUBLISH_LIMIT = 5

export const REPORTS_TO_REVIEW = 5

export const IDEAS_PAGE = 10

export type PublishStatus = LibraryStatus | 'duplicate' | 'blocked'

export function publishText(
  lang: Lang,
  status: Exclude<PublishStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.publish[status]
  return status === 'limit' ? fill(text, { n: PUBLISH_LIMIT }) : text
}

export type ReactionStatus = LibraryStatus | 'own' | 'blocked'

export function reactionText(
  lang: Lang,
  status: Exclude<ReactionStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.reaction[status]
  return status === 'limit' ? fill(text, { n: LIBRARY_LIMIT }) : text
}

export const COMMENT_LIMIT = 300

export function normalizeComment(input: unknown): string | null {
  if (typeof input !== 'string') return null
  return input.replace(/\s+/g, ' ').trim().slice(0, COMMENT_LIMIT) || null
}

export type LoginReason = 'favorite' | 'like' | 'report'

export function loginText(lang: Lang, reason: LoginReason): string {
  return DICTS[lang].status.login[reason]
}
