import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nextFace } from '../model/accents'
import { shiftMonth } from '../model/calendar'
import { encodeTemplate, hashFor } from '../model/codec'
import { demoFill } from '../model/demoFill'
import { templateDays } from '../model/fill'
import { loadDraft, saveDraft } from '../model/storage'
import { createDemoTemplate, createEmptyTemplate, createPerson, nextPersonId } from '../model/templates'
import type { Template } from '../model/types'
import { EMPTY_FILL, MAX_PEOPLE, MIN_PEOPLE } from '../model/types'
import type { DocMode, DocSource, DocValue } from './docContext'
import { DocContext } from './docContext'

export interface Boot {
  template: Template
  source: DocSource
  hasDraft: boolean
}

const URL_SYNC_DELAY = 400

/** Иммутабельная запись по пути 'people.0.name'. Документ маленький, клон дешёвый. */
function setByPath(template: Template, path: string, value: string): Template {
  const keys = path.split('.')
  const clone = structuredClone(template)
  let node = clone as unknown as Record<string, unknown>
  for (const key of keys.slice(0, -1)) {
    node = node[key] as Record<string, unknown>
  }
  node[keys[keys.length - 1]] = value
  return clone
}

function getByPath(template: Template, path: string): string {
  let node: unknown = template
  for (const key of path.split('.')) {
    node = (node as Record<string, unknown>)?.[key]
  }
  return typeof node === 'string' ? node : ''
}

export function DocProvider({ boot, children }: { boot: Boot; children: React.ReactNode }) {
  const [template, setTemplate] = useState<Template>(boot.template)
  const [source, setSource] = useState<DocSource>(boot.source)
  const [mode, setMode] = useState<DocMode>('view')
  const [hasDraft, setHasDraft] = useState(boot.hasDraft)

  /** Хэш, который записали мы сами — чтобы не перечитывать собственную же правку. */
  const ownHash = useRef<string>(location.hash)

  // Чужой хэш в адресной строке (вставили ссылку, кнопка «назад») — читаем лист заново.
  useEffect(() => {
    const onHashChange = () => {
      if (location.hash !== ownHash.current) location.reload()
    }
    addEventListener('hashchange', onHashChange)
    return () => removeEventListener('hashchange', onHashChange)
  }, [])

  // Свой лист всегда отражён в адресной строке и в черновике.
  useEffect(() => {
    if (source !== 'custom') return
    let cancelled = false
    const timer = setTimeout(() => {
      void encodeTemplate(template).then((payload) => {
        if (cancelled) return
        const hash = hashFor(payload)
        ownHash.current = hash
        history.replaceState(null, '', hash)
        saveDraft(template)
        setHasDraft(true)
      })
    }, URL_SYNC_DELAY)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [template, source])

  const fill = source === 'demo' ? demoFill : EMPTY_FILL
  const days = templateDays(template)

  const update = useCallback((recipe: (current: Template) => Template) => {
    setTemplate((current) => recipe(current))
  }, [])

  const field = useCallback(
    (path: string) => ({
      value: getByPath(template, path),
      onChange: (value: string) => setTemplate((current) => setByPath(current, path, value)),
    }),
    [template],
  )

  const startCustom = useCallback((next: Template) => {
    setTemplate(next)
    setSource('custom')
    setMode('edit')
    // Мгновенно, а не smooth: плавная прокрутка сбивается перерисовкой листа.
    scrollTo(0, 0)
  }, [])

  const value = useMemo<DocValue>(
    () => ({
      template,
      fill,
      mode,
      source,
      days,
      editing: mode === 'edit',
      hasDraft,
      field,
      setMode,
      fork: () => startCustom(structuredClone(template)),
      startBlank: () => startCustom(createEmptyTemplate()),
      continueDraft: () => {
        const draft = loadDraft()
        if (draft) startCustom(draft)
      },
      openDemo: () => {
        // Черновик не трогаем: к нему можно вернуться кнопкой «Продолжить правку».
        setTemplate(createDemoTemplate())
        setSource('demo')
        setMode('view')
        ownHash.current = ''
        history.replaceState(null, '', location.pathname + location.search)
      },
      addPerson: () =>
        update((current) =>
          current.people.length >= MAX_PEOPLE
            ? current
            : {
                ...current,
                people: [
                  ...current.people,
                  createPerson(nextPersonId(current.people), 'son'),
                ],
              },
        ),
      removePerson: (id: string) =>
        update((current) =>
          current.people.length <= MIN_PEOPLE
            ? current
            : { ...current, people: current.people.filter((person) => person.id !== id) },
        ),
      cycleFace: (id: string) =>
        update((current) => ({
          ...current,
          people: current.people.map((person) =>
            person.id === id ? { ...person, face: nextFace(person.face) } : person,
          ),
        })),
      stepMonth: (delta: number) =>
        update((current) => ({
          ...current,
          theme: { ...current.theme, ...shiftMonth(current.theme, delta) },
        })),
      buildShareUrl: async () => {
        const payload = await encodeTemplate(template)
        return `${location.origin}${location.pathname}${location.search}${hashFor(payload)}`
      },
    }),
    [template, fill, mode, source, days, hasDraft, field, update, startCustom],
  )

  return <DocContext.Provider value={value}>{children}</DocContext.Provider>
}
