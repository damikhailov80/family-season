import { normalizeTemplate } from './codec'
import { knownIconSet } from './icons'
import { knownLang, type Lang } from './lang'
import { defaultSeasonTitle, normalizeTitle } from './library'
import { knownPalette } from './palettes'
import { createEmptyTemplate } from './templates'
import type { Template } from './types'
import type { IconSetId, PaletteId } from '../types'

const KEY = 'family-season:draft'

export interface Draft {
  title: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  lang: Lang
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

export function draftSnapshot(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

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
    const lang = knownLang(saved?.lang)
    return {
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

let claimed = false

export function writeDraft(draft: Omit<Draft, 'savedAt'>): void {
  if (claimed) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: Date.now() }))
    announce()
  } catch {}
}

export function sealDraft(): void {
  claimed = true
  clearDraft()
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY)
    announce()
  } catch {}
}
