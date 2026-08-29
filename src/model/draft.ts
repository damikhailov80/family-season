import { normalizeTemplate } from './codec'
import { knownIconSet } from './icons'
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
  template: Template
  palette: PaletteId
  iconSet: IconSetId
}

/** Пустой бланк — с него начинается черновик, которого ещё нет. */
export function emptyDraft(): Draft {
  return {
    template: createEmptyTemplate(),
    palette: knownPalette(null),
    iconSet: knownIconSet(null),
  }
}

/**
 * Прочитанное нормализуем ровно так же, как всё, что приходит снаружи: в
 * `localStorage` мог залезть кто угодно, да и формат бланка со временем меняется.
 */
export function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<Draft>
    return {
      template: normalizeTemplate(saved?.template),
      palette: knownPalette(saved?.palette),
      iconSet: knownIconSet(saved?.iconSet),
    }
  } catch {
    return null
  }
}

export function writeDraft(draft: Draft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Память кончилась или запрещена — постер от этого работать не перестаёт.
  }
}

/** Черновик уехал в кабинет строкой — держать его копию больше незачем. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // См. `writeDraft`.
  }
}
