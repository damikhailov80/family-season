import { LIBRARY_LIMIT, type LibraryStatus } from './library'
import type { Lang } from './lang'
import { DICTS } from '../i18n/dict'
import { fill } from '../i18n/fill'

/**
 * Витрина «Идеи сообщества»: выложенные сезоны.
 *
 * Файл, как и `model/library.ts`, намеренно без серверных зависимостей: его
 * читают и панели постера, и серверные действия, и сама витрина. Слова живут в
 * словаре — здесь числа, типы и доступ к ним.
 */

/**
 * Сколько сезонов один человек может держать на витрине.
 *
 * Число своё, а не `LIBRARY_LIMIT`: коллекция — это склад, и сто строк в ней
 * никому не мешают, а витрина — общая полка, и десяток случайных сезонов на ней
 * не должен оказываться сезонами одного и того же автора. Предел считается по
 * тому, что на витрине **видно**: снятое место не занимает — иначе слова «уберите
 * лишние с витрины» были бы неправдой.
 */
export const PUBLISH_LIMIT = 5

/**
 * Со скольких жалоб публикация попадает в очередь на разбор.
 *
 * Это **порог внимания, а не автоматическое действие**: витрина ничего не прячет
 * сама. Закрывает сезон человек — руками, через `npm run db:reports`, — потому
 * что молча спрятанный сезон не объясняет автору ничего, а шестеро сговорившихся
 * не должны уметь убирать чужое без разбора.
 *
 * Считаются авторы жалоб, а не нажатия: повторная жалоба одного и того же
 * человека прежнюю заменяет.
 */
export const REPORTS_TO_REVIEW = 5

/** Сколько сезонов показывать за один заход. */
export const IDEAS_PAGE = 10

/**
 * Чем кончилась публикация. К бедам своих сезонов добавлена ровно одна своя:
 * `duplicate` — «такой сезон уже выложен». Она разведена с `error` по той же
 * причине, что и `limit`: человеку понятно, что случилось, и чинить есть что.
 */
export type PublishStatus = LibraryStatus | 'duplicate' | 'blocked'

/**
 * Слова, которыми витрина объясняет отказ.
 *
 * `anonymous` сюда не попадает: до кнопки публикации доходит только вошедший —
 * выкладывают **свой сохранённый** сезон, а он есть только у него.
 */
export function publishText(
  lang: Lang,
  status: Exclude<PublishStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.publish[status]
  return status === 'limit' ? fill(text, { n: PUBLISH_LIMIT }) : text
}

/**
 * Чем кончился лайк, жалоба или звёздочка. Своя беда здесь одна: `own` — «это
 * ваш собственный сезон». Она разведена с `error` по той же причине, что и
 * `limit`: человеку понятно, что случилось, и чинить нечего.
 */
export type ReactionStatus = LibraryStatus | 'own' | 'blocked'

export function reactionText(
  lang: Lang,
  status: Exclude<ReactionStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.reaction[status]
  return status === 'limit' ? fill(text, { n: LIBRARY_LIMIT }) : text
}

/**
 * Предел комментария к жалобе. Не бюджет бумаги, как у полей постера, а мера
 * жанра: жалоба — это строчка «здесь мат», а не письмо.
 */
export const COMMENT_LIMIT = 300

/**
 * Комментарий к жалобе приходит из браузера. Однострочный и обрезанный — как всё
 * остальное, что мы принимаем снаружи. Пустой возвращается как `null`: жалоба без
 * слов бесполезна тому, кто будет в ней разбираться, и отправлять её незачем.
 */
export function normalizeComment(input: unknown): string | null {
  if (typeof input !== 'string') return null
  return input.replace(/\s+/g, ' ').trim().slice(0, COMMENT_LIMIT) || null
}

/**
 * Зачем понадобился вход: у избранного, лайка и жалобы своя строчка. Заголовок
 * у окна общий, меняется только фраза под ним — она называет то, что человек
 * нажал.
 */
export type LoginReason = 'favorite' | 'like' | 'report'

export function loginText(lang: Lang, reason: LoginReason): string {
  return DICTS[lang].status.login[reason]
}
