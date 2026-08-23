import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nextFace } from '../model/accents'
import { shiftMonth } from '../model/calendar'
import {
  decodeTemplate,
  encodeTemplate,
  hashFor,
  readEditFlag,
  readHashPayload,
  readNewFlag,
} from '../model/codec'
import { demoFill } from '../model/demoFill'
import { templateDays } from '../model/fill'
import { createDemoTemplate, createEmptyTemplate, createPerson, nextPersonId } from '../model/templates'
import type { Template } from '../model/types'
import { EMPTY_FILL, MAX_PEOPLE, MIN_PEOPLE } from '../model/types'
import type { DocMode, DocSource, DocValue } from './docContext'
import { DocContext } from './docContext'

export interface Boot {
  template: Template
  source: DocSource
  mode: DocMode
}

const URL_SYNC_DELAY = 400

/**
 * Пометка на записи истории: её создала кнопка форка, а значит позади в истории
 * лежит пример. Живёт в `history.state`, а не в React: переживает перезагрузку и
 * привязана к конкретной записи. По ней «К примеру» уходит назад, а не толкает
 * новую запись — только так лист остаётся впереди и кнопка «вперёд» работает.
 */
const OWN_ENTRY = { own: true }

function isOwnEntry(): boolean {
  return (history.state as { own?: boolean } | null)?.own === true
}

/** Адрес без хэша — на нём живёт пример. */
function bareUrl(): string {
  return location.pathname + location.search
}

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
  const [mode, setMode] = useState<DocMode>(boot.mode)

  /**
   * Счётчик переходов. Кодирование асинхронное, а «назад» — мгновенное: без него
   * отложенная запись URL может дописать правку в уже другую запись истории.
   */
  const navSeq = useRef(0)

  const showDemo = useCallback(() => {
    setTemplate(createDemoTemplate())
    setSource('demo')
    setMode('view')
  }, [])

  // Переход по истории (назад/вперёд, правка адреса). Перезагружать страницу не нужно:
  // всё состояние листа и так лежит в хэше.
  useEffect(() => {
    const onHashChange = () => {
      const seq = (navSeq.current += 1)
      const payload = readHashPayload()
      if (!payload) {
        // `#new=1` — просьба лендинга открыть пустой бланк. Через 400 мс запись URL
        // заменит её на `#d=…`, так что в истории эта пометка почти не задерживается.
        if (readNewFlag()) {
          setTemplate(createEmptyTemplate())
          setSource('custom')
          setMode('edit')
          return
        }
        showDemo()
        return
      }
      void decodeTemplate(payload).then((next) => {
        if (navSeq.current !== seq) return
        if (!next) {
          showDemo()
          return
        }
        setTemplate(next)
        setSource('custom')
        // Вернулись «вперёд» в свой лист — продолжаем прерванный сеанс правки.
        setMode(isOwnEntry() || readEditFlag() ? 'edit' : 'view')
      })
    }
    addEventListener('hashchange', onHashChange)
    return () => removeEventListener('hashchange', onHashChange)
  }, [showDemo])

  // Адресная строка — единственное хранилище листа. Правка следов в истории не
  // оставляет: replaceState переписывает ту же запись, сохраняя её пометку.
  useEffect(() => {
    if (source !== 'custom') return
    const seq = navSeq.current
    let cancelled = false
    const timer = setTimeout(() => {
      void encodeTemplate(template).then((payload) => {
        if (cancelled || navSeq.current !== seq) return
        const hash = hashFor(payload)
        if (hash === location.hash) return
        // history.state обязателен: null затёр бы пометку своей записи.
        history.replaceState(history.state, '', hash)
      })
    }, URL_SYNC_DELAY)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [template, source])

  // Адрес кнопки форка: он же уходит в pushState, так что обычный клик и клик
  // с модификатором (новая вкладка) ведут в одно и то же место.
  const [forkLink, setForkLink] = useState('')

  useEffect(() => {
    if (source !== 'demo') return
    let cancelled = false
    void encodeTemplate(template).then((payload) => {
      if (cancelled) return
      setForkLink(hashFor(payload, true))
    })
    return () => {
      cancelled = true
    }
  }, [source, template])

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

  // Единственное место, где лист добавляет запись в историю: «назад» из своего
  // листа возвращает к примеру.
  const startCustom = useCallback(async (next: Template) => {
    const payload = await encodeTemplate(next)
    navSeq.current += 1
    history.pushState(OWN_ENTRY, '', hashFor(payload, true))
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
      links: { fork: forkLink, demo: bareUrl() },
      field,
      setMode,
      fork: () => void startCustom(structuredClone(template)),
      openDemo: () => {
        // Свой лист остаётся в истории впереди: «вперёд» вернёт его целиком.
        if (isOwnEntry()) {
          history.back()
          return
        }
        navSeq.current += 1
        history.pushState(null, '', bareUrl())
        showDemo()
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
        return `${location.origin}${bareUrl()}${hashFor(payload)}`
      },
    }),
    [template, fill, mode, source, days, forkLink, field, update, startCustom, showDemo],
  )

  return <DocContext.Provider value={value}>{children}</DocContext.Provider>
}
