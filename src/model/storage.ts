import { normalizeTemplate } from './codec'
import type { Template } from './types'

/**
 * Черновик правок. Ссылка — источник правды для пересылки, но вкладку легко
 * закрыть, не скопировав её, поэтому дублируем шаблон в localStorage.
 */
const KEY = 'family-season:draft:v1'

interface Draft {
  savedAt: number
  template: Template
}

export function saveDraft(template: Template): void {
  try {
    const draft: Draft = { savedAt: Date.now(), template }
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Приватный режим или переполненное хранилище — черновик не критичен.
  }
}

export function loadDraft(): Template | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as Draft
    if (!draft?.template) return null
    return normalizeTemplate(draft.template)
  } catch {
    return null
  }
}
