import { normalizeTemplate } from './codec'
import { knownIconSet } from './icons'
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
   * Когда записан в последний раз. Единственное поле, которое приходится хранить:
   * месяц и тему список выводит из самого бланка, а дату вывести неоткуда.
   */
  savedAt: number
}

/**
 * А это уже про потерю набранного, и говорится только когда черновик есть.
 * Название называем: «черновик будет затёрт» человек проверить не может, а
 * «„Сентябрь у бабушки“ будет затёрт» — может.
 */
export function draftWillBeLost(title: string): string {
  return (
    `Черновик в этом браузере один, и место займёт новый: «${title}» будет затёрт без ` +
    'возможности вернуть. Войдя сейчас, вы его не потеряете — прежний черновик уедет в ' +
    'коллекцию первой строкой.'
  )
}

/** Пустой бланк — с него начинается черновик, которого ещё нет. */
export function emptyDraft(): Draft {
  const template = createEmptyTemplate()
  return {
    title: defaultSeasonTitle(template),
    template,
    palette: knownPalette(null),
    iconSet: knownIconSet(null),
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
    return {
      // Черновики, записанные до появления имени, получают его на месте — то же
      // самое, каким его подставит окно заведения.
      title: normalizeTitle(saved?.title, defaultSeasonTitle(template)),
      template,
      palette: knownPalette(saved?.palette),
      iconSet: knownIconSet(saved?.iconSet),
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
 * Отметку времени ставит сама запись, а не тот, кто её зовёт: писателей у
 * черновика четверо, и забыть её — значит показать в списке чужую дату.
 */
export function writeDraft(draft: Omit<Draft, 'savedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }))
    announce()
  } catch {
    // Память кончилась или запрещена — постер от этого работать не перестаёт.
  }
}

/** Черновик уехал в кабинет строкой — держать его копию больше незачем. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
    announce()
  } catch {
    // См. `writeDraft`.
  }
}
