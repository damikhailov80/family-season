import { normalizeTemplate } from './codec'
import { knownIconSet } from './icons'
import { knownLang, type Lang } from './lang'
import { defaultSeasonTitle, normalizeTitle } from './library'
import { knownPalette } from './palettes'
import { createEmptyTemplate } from './templates'
import type { Template } from './types'
import type { IconSetId, PaletteId } from '../types'

/**
 * Черновик невошедшего: единственный постер, который живёт в браузере.
 *
 * `localStorage` в этом проекте был запрещён — и запрет снят намеренно. Он
 * защищал не от технологии, а от **второй копии** состояния: пока лист жил в
 * адресе, любое другое хранилище рано или поздно разошлось бы с ним. Теперь у
 * сезона ровно одно место: у вошедшего — строка в базе, у невошедшего — вот эта
 * запись. Второй копии по-прежнему нет.
 *
 * Черновик один. Не потому, что нельзя завести список, а потому, что список
 * своих сезонов — это и есть кабинет: он требует входа, и это честная цена.
 *
 * Обращения обёрнуты в try: в приватном окне и при запрете на данные сайта
 * `localStorage` бросает на самом доступе. Постер обязан работать и тогда —
 * просто без памяти между перезагрузками.
 */

const KEY = 'family-season:draft'

export interface Draft {
  /**
   * Имя даётся при заведении, как и у строки в базе: список без имён нечитаем, а
   * список у черновика теперь есть — он виден на `/seasons`.
   */
  title: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  /**
   * Язык сезона: им подписан сам лист. Лежит рядом с темой и набором рисунков,
   * а не внутри бланка, — ровно как у строки в базе лежит колонка `language`.
   * Язык интерфейса ему не указ: переключив сайт, человек не переписывает
   * набранный черновик.
   */
  lang: Lang
  /**
   * Когда записан в последний раз. Единственное поле, которое приходится хранить:
   * месяц и тему список выводит из самого бланка, а дату вывести неоткуда.
   */
  savedAt: number
}

/**
 * Пустой бланк — с него начинается черновик, которого ещё нет.
 *
 * Слова о том, что прежний черновик будет затёрт, живут в словаре
 * (`dialogs.draftWillBeLost`): окон заведения два, и вторая копия текста
 * разошлась бы с первой.
 */
export function emptyDraft(lang: Lang): Draft {
  const template = createEmptyTemplate()
  return {
    title: defaultSeasonTitle(template, lang),
    template,
    palette: knownPalette(null),
    iconSet: knownIconSet(null),
    lang,
    savedAt: Date.now(),
  }
}

/**
 * Сырая запись — снимок хранилища для `useSyncExternalStore`: снимок обязан быть
 * стабильной ссылкой, а разобранный черновик каждый раз новый объект.
 */
export function draftSnapshot(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/**
 * Кто хочет знать о смене черновика. Своя запись `storage` не рождает — событие
 * приходит только из соседней вкладки, — поэтому писатели зовут `announce` сами.
 */
const listeners = new Set<() => void>()

function announce(): void {
  for (const notify of listeners) notify()
}

export function subscribeDraft(notify: () => void): () => void {
  listeners.add(notify)
  addEventListener('storage', notify)
  return () => {
    listeners.delete(notify)
    removeEventListener('storage', notify)
  }
}

/**
 * Прочитанное нормализуем ровно так же, как всё, что приходит снаружи: в
 * `localStorage` мог залезть кто угодно, да и формат бланка со временем меняется.
 */
export function parseDraft(raw: string | null): Draft | null {
  try {
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<Draft>
    const template = normalizeTemplate(saved?.template)
    // Черновик, записанный до появления языков, получает русский — тот
    // единственный, на котором его и собирали.
    const lang = knownLang(saved?.lang)
    return {
      // Черновики, записанные до появления имени, получают его на месте — то же
      // самое, каким его подставит окно заведения.
      title: normalizeTitle(saved?.title, defaultSeasonTitle(template, lang)),
      template,
      palette: knownPalette(saved?.palette),
      iconSet: knownIconSet(saved?.iconSet),
      lang,
      savedAt: typeof saved?.savedAt === 'number' ? saved.savedAt : Date.now(),
    }
  } catch {
    return null
  }
}

/** Черновик целиком. Разовое чтение — там, где следить за хранилищем не нужно. */
export function readDraft(): Draft | null {
  return parseDraft(draftSnapshot())
}

/**
 * Черновик уже уехал строкой в коллекцию. Флажок живёт до перезагрузки и нужен
 * ровно затем, чтобы забранное не воскресло: на `/sheet` рядом работает
 * `DraftStore`, он пишет черновик дебаунсом, и его отложенная запись легла бы
 * в хранилище уже **после** того, как мы его вычистили.
 */
let claimed = false

/**
 * Отметку времени ставит сама запись, а не тот, кто её зовёт: писателей у
 * черновика четверо, и забыть её — значит показать в списке чужую дату.
 */
export function writeDraft(draft: Omit<Draft, 'savedAt'>): void {
  if (claimed) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }))
    announce()
  } catch {
    // Память кончилась или запрещена — постер от этого работать не перестаёт.
  }
}

/**
 * Черновик забрали в коллекцию: стираем — и запираем хранилище до перезагрузки.
 * Отдельно от `clearDraft` потому, что удаление руками запирать нельзя: следом
 * за ним человек тут же заводит новый черновик кнопкой «Новый сезон».
 */
export function sealDraft(): void {
  claimed = true
  clearDraft()
}

/** Черновик удалили руками — держать его копию больше незачем. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
    announce()
  } catch {
    // См. `writeDraft`.
  }
}
