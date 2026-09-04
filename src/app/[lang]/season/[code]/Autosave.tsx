'use client'

import { useEffect, useRef, useState } from 'react'
import { Toast } from '../../../../components/site/Toast'
import { useDict } from '../../../../i18n/context'
import { saveSeason } from '../../../../server/actions'
import { useDoc } from '../../../../state/docContext'

const SAVE_DELAY = 400

export function Autosave({ code }: { code: string }) {
  const { pages } = useDict()
  const { template, palette, iconSet } = useDoc()
  const saved = useRef<string | null>(null)
  const latest = useRef({ template, palette, iconSet })
  const [failed, setFailed] = useState<number | null>(null)

  useEffect(() => {
    latest.current = { template, palette, iconSet }
  })

  useEffect(() => {
    const snapshot = JSON.stringify([template, palette, iconSet])
    if (saved.current === null) {
      saved.current = snapshot
      return
    }
    if (saved.current === snapshot) return

    const timer = setTimeout(() => {
      saved.current = snapshot
      void saveSeason(code, { template, palette, iconSet }).then((status) => {
        if (status === 'ok') return
        saved.current = null
        setFailed(Date.now())
      })
    }, SAVE_DELAY)

    return () => clearTimeout(timer)
  }, [template, palette, iconSet, code])

  useEffect(() => {
    return () => {
      const snapshot = JSON.stringify([
        latest.current.template,
        latest.current.palette,
        latest.current.iconSet,
      ])
      if (saved.current === snapshot) return
      void saveSeason(code, latest.current)
    }
  }, [code])

  return failed ? <Toast key={failed} message={pages.autosaveFailed} /> : null
}
