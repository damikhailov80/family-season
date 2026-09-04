import { normalizeTemplate } from './codec'
import { knownIconSet } from './icons'
import { knownLang, type Lang } from './lang'
import { defaultSeasonTitle, normalizeTitle } from './library'
import { knownPalette } from './palettes'
import { createEmptyTemplate } from './templates'
import type { Template } from './types'
import type { IconSetId, PaletteId } from '../types'

/**
 * Черновик невошедшего: единственный постер, который живёт в браузере, и он
 * один — список своих сезонов это и есть кабинет, а он требует входа.
 *
 * Обращения обёрнуты в try: в приватном окне и при запрете на данные сайта
 * `localStorage` бросает на самом доступе, а постер обязан работать и тогда.
 */

const KEY = 'family-season:draft'

export interface Draft {
  title: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  /** Рядом с бланком, а не внутри него: язык интерфейса черновику не указ. */
  lang: Lang
  /** Единственное хранимое поле списка: месяц и тему он выводит из бланка. */
  savedAt: number
}

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
 * Снимок для `useSyncExternalStore` — сырая строка: снимок обязан быть стабильной
 * ссылкой, а разобранный черновик каждый раз новый объект.
 */
export function draftSnapshot(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

// Своя запись события `storage` не рождает, поэтому писатели зовут `announce` сами.
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

export function parseDraft(raw: string | null): Draft | null {
  try {
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<Draft>
    const template = normalizeTemplate(saved?.template)
    // Черновик, записанный до появления языков, собирали на русском.
    const lang = knownLang(saved?.lang)
    return {
      // Черновику, записанному до появления имени, подставляем его на месте.
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

export function readDraft(): Draft | null {
  return parseDraft(draftSnapshot())
}

/**
 * Флажок живёт до перезагрузки и нужен затем, чтобы забранное не воскресло: на
 * `/sheet` рядом работает `DraftStore`, он пишет дебаунсом, и его отложенная
 * запись легла бы в хранилище уже после чистки.
 */
let claimed = false

/**
 * Отметку времени ставит сама запись, а не тот, кто её зовёт: писателей четверо,
 * и забыть её — значит показать в списке чужую дату.
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
 * Стираем и запираем хранилище до перезагрузки. Отдельно от `clearDraft` потому,
 * что удаление руками запирать нельзя: следом человек заводит новый черновик.
 */
export function sealDraft(): void {
  claimed = true
  clearDraft()
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
    announce()
  } catch {
    // См. `writeDraft`.
  }
}
