'use client'

import { useEffect, useState } from 'react'
import { normalizeFamily, type FamilyPreset } from '../model/family'

export function useFamilyPreset(enabled: boolean): FamilyPreset | null {
  const [family, setFamily] = useState<FamilyPreset | null>(null)

  useEffect(() => {
    if (!enabled) return
    const abort = new AbortController()
    fetch('/api/family', { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setFamily(data?.family ? normalizeFamily(data.family) : null)
      })
      .catch(() => setFamily(null))
    return () => abort.abort()
  }, [enabled])

  return family
}
