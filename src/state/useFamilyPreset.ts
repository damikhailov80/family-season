'use client'

import { useEffect, useState } from 'react'
import { normalizeFamily, type FamilyPreset } from '../model/family'

/**
 * Спрашиваем только в правке: в просмотре и на примере подставлять некуда. Любая
 * беда — это `null`, а не ошибка: лист обязан работать без сервера, и молчание
 * значит ровно одно — кнопки не будет.
 */
export function useFamilyPreset(enabled: boolean): FamilyPreset | null {
  const [family, setFamily] = useState<FamilyPreset | null>(null)

  useEffect(() => {
    if (!enabled) return
    const abort = new AbortController()
    fetch('/api/family', { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        // Пришло из сети — доверять нельзя, гоним через ту же нормализацию.
        setFamily(data?.family ? normalizeFamily(data.family) : null)
      })
      .catch(() => setFamily(null))
    return () => abort.abort()
  }, [enabled])

  return family
}
