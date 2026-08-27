import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nextFace } from '../model/accents'
import { shiftMonth } from '../model/calendar'
import {
  decodeTemplate,
  encodeTemplate,
  hashFor,
  readFillId,
  readHashPayload,
  readNewFlag,
  readIconSetId,
  readPaletteId,
  readSeasonId,
} from '../model/codec'
import { templateDays } from '../model/fill'
import { limitFor } from '../model/limits'
import { DEFAULT_EXAMPLE_ID, exampleById, fillOf, knownExampleId } from '../model/examples'
import { modeFromPath, pathForMode, ROUTES } from '../model/site'
import { DEFAULT_ICON_SET } from '../model/icons'
import { DEFAULT_PALETTE } from '../model/palettes'
import { normalizeFamily, type FamilyPreset } from '../model/family'
import { createEmptyTemplate, createPerson, nextPersonId } from '../model/templates'
import type { IconSetId, PaletteId } from '../types'
import type { Template } from '../model/types'
import { MAX_PEOPLE, MIN_PEOPLE } from '../model/types'
import type { DocMode, DocSource, DocValue, FieldBinding } from './docContext'
import { DocContext } from './docContext'

export interface Boot {
  template: Template
  /** id набора заполнения из `data=`; null — свой лист, слой заполнения пуст. */
  fillId: string | null
  /** Тема из `p=`; пометки нет — тема по умолчанию. Частью бланка она не является. */
  palette: PaletteId
  /** Набор рисунков из `i=`; устроен как тема и в бланк тоже не входит. */
  iconSet: IconSetId
  /** id своей сохранённой строки из `s=`; частью бланка не является. */
  seasonId: string | null
  mode: DocMode
}

const URL_SYNC_DELAY = 400

/**
 * Пометки на записи истории. Они описывают не лист, а соседей записи, поэтому
 * живут в `history.state`, а не в React: переживают перезагрузку и привязаны к
 * конкретной записи.
 */
interface EntryMarks {
  /** id сеанса правки: связывает запись правки и запись просмотра под ней. */
  viewOf?: number
  /** Эту запись создала кнопка «Править», позади — просмотр того же листа. */
  edit?: boolean
}

function marksOf(): EntryMarks {
  return (history.state ?? {}) as EntryMarks
}

/**
 * Состояние для НОВОЙ записи истории. Служебные поля Next (`__NA`, дерево) обязаны
 * уехать в неё: с ними патченный Next-ом `pushState` уходит мимо роутера, маршрут не
 * перерисовывается и лист не теряет несохранённый шаблон. Свои пометки, наоборот,
 * не наследуются — у новой записи другие соседи.
 */
function entryState(marks: EntryMarks): Record<string, unknown> {
  const state = { ...(history.state as Record<string, unknown> | null) }
  delete state.viewOf
  delete state.edit
  return { ...state, ...marks }
}

/**
 * Путь — проекция режима: правка живёт на /sheet/edit, всё остальное на /sheet.
 * Здесь же приводятся к правилам легаси-адреса (`edit=1`, `new=1`) и попытка
 * открыть пример в правке. Передавать `history.state` обязательно — иначе вызов
 * пойдёт мимо короткого пути в патче Next (см. `entryState`).
 */
function syncPath(mode: DocMode, fillId: string | null) {
  const path = pathForMode(fillId ? 'view' : mode)
  if (location.pathname.replace(/\/+$/, '') === path) return
  history.replaceState(history.state, '', path + location.hash)
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
  const [fillId, setFillId] = useState<string | null>(boot.fillId)
  const [palette, setPalette] = useState<PaletteId>(boot.palette)
  const [iconSet, setIconSet] = useState<IconSetId>(boot.iconSet)
  const [seasonId, setSeasonId] = useState<string | null>(boot.seasonId)
  const [mode, setMode] = useState<DocMode>(boot.mode)

  /**
   * Счётчик переходов. Кодирование асинхронное, а «назад» — мгновенное: без него
   * отложенная запись URL может дописать правку в уже другую запись истории.
   */
  const navSeq = useRef(0)

  /**
   * id текущего сеанса правки, начатой кнопкой «Править». Совпадение с пометкой
   * `viewOf` на записи — единственный признак «подо мной просмотр этого же листа».
   * После перезагрузки id другой, и работает обычное чтение адреса.
   */
  const editSession = useRef<number | null>(null)

  const showExample = useCallback((id: string) => {
    const example = exampleById(id)!
    setTemplate(example.template())
    // Тема примера — его собственная, но `p=` в адресе сильнее.
    setPalette(readPaletteId() ?? example.palette)
    setIconSet(readIconSetId() ?? example.iconSet)
    setFillId(id)
    // Пример не бывает сохранённым сезоном: его не сохраняют, а форкают.
    setSeasonId(null)
    setMode('view')
    syncPath('view', id)
  }, [])

  // Адрес приводится к правилам один раз при загрузке: легаси-флаги и попытка открыть
  // пример в правке превращаются в правильный путь. `boot` за жизнь провайдера не
  // меняется, дальше за путь отвечают переходы и переключение режима.
  useEffect(() => {
    syncPath(boot.mode, boot.fillId)
  }, [boot.mode, boot.fillId])

  // Переход по истории (назад/вперёд, правка адреса). Перезагружать страницу не нужно:
  // всё состояние листа и так лежит в адресе.
  useEffect(() => {
    const onNavigate = () => {
      const marks = marksOf()

      // Вышли «назад» из правки на просмотр того же листа. Адрес этой записи хранит
      // допоследнюю версию — свежий шаблон лежит в памяти, его и оставляем, а хэш
      // перепишет обычная синхронизация URL. Пометку сеанса не сбрасываем: по хэшу
      // приходят сразу два события, и вторая проходка должна попасть сюда же.
      if (editSession.current !== null && marks.viewOf === editSession.current && !marks.edit) {
        navSeq.current += 1
        setMode('view')
        return
      }

      const seq = (navSeq.current += 1)
      editSession.current = marks.edit ? (marks.viewOf ?? null) : null

      const id = knownExampleId(readFillId())
      const payload = readHashPayload()

      if (!payload) {
        if (id) {
          showExample(id)
          return
        }
        // Голый /sheet/edit — пустой бланк; `new=1` тот же адрес в легаси-виде.
        if (modeFromPath() === 'edit' || readNewFlag()) {
          setTemplate(createEmptyTemplate())
          setPalette(readPaletteId() ?? DEFAULT_PALETTE)
          setIconSet(readIconSetId() ?? DEFAULT_ICON_SET)
          setFillId(null)
          setSeasonId(null)
          setMode('edit')
          syncPath('edit', null)
          return
        }
        showExample(DEFAULT_EXAMPLE_ID)
        return
      }

      void decodeTemplate(payload).then((next) => {
        if (navSeq.current !== seq) return
        if (!next) {
          showExample(DEFAULT_EXAMPLE_ID)
          return
        }
        // Пример не правится: `data=` перебивает путь и оставляет просмотр.
        const nextMode: DocMode = id ? 'view' : modeFromPath()
        setTemplate(next)
        setPalette(readPaletteId() ?? (id ? exampleById(id)!.palette : DEFAULT_PALETTE))
        setIconSet(readIconSetId() ?? (id ? exampleById(id)!.iconSet : DEFAULT_ICON_SET))
        setFillId(id)
        setSeasonId(id ? null : readSeasonId())
        setMode(nextMode)
        syncPath(nextMode, id)
      })
    }

    // Смена одного пути не порождает `hashchange`, а правка адреса руками не порождает
    // `popstate` — нужны оба. При переходе по хэшу приходят оба сразу: разбор
    // идемпотентен, а поздний результат отбрасывает `navSeq`.
    addEventListener('popstate', onNavigate)
    addEventListener('hashchange', onNavigate)
    return () => {
      removeEventListener('popstate', onNavigate)
      removeEventListener('hashchange', onNavigate)
    }
  }, [showExample])

  // Адрес кнопки форка: он же уходит в pushState, так что обычный клик и клик
  // с модификатором (новая вкладка) ведут в одно и то же место.
  const [forkLink, setForkLink] = useState('')

  /*
   * Адресная строка — единственное хранилище листа. Правка следов в истории не
   * оставляет: replaceState переписывает ту же запись, сохраняя её пометки.
   * `mode` в зависимостях не ради хэша, а ради выхода «назад» из правки: там
   * меняется только он, а хэш записи просмотра остаётся от предыдущей версии.
   */
  useEffect(() => {
    const seq = navSeq.current
    let cancelled = false
    // Пример не правят — его адрес приводится к каноническому сразу, без дебаунса.
    const timer = setTimeout(
      () => {
        void encodeTemplate(template).then((payload) => {
          if (cancelled || navSeq.current !== seq) return
          // Форк начинает свой сезон: ни набора заполнения, ни пометки сохранения.
          if (fillId) setForkLink(ROUTES.sheetEdit + hashFor(payload, palette, iconSet))
          const hash = hashFor(payload, palette, iconSet, fillId, seasonId)
          if (hash === location.hash) return
          // history.state обязателен: null затёр бы пометки своей записи.
          history.replaceState(history.state, '', hash)
        })
      },
      fillId ? 0 : URL_SYNC_DELAY,
    )

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [template, fillId, palette, iconSet, seasonId, mode])

  const source: DocSource = fillId ? 'demo' : 'custom'
  const fill = fillOf(fillId)
  const days = templateDays(template)

  const update = useCallback((recipe: (current: Template) => Template) => {
    setTemplate((current) => recipe(current))
  }, [])

  /*
   * Предел едет вместе с привязкой, поэтому секциям про него знать нечего: они и так
   * разворачивают `field(...)` в пропы. Обрезка здесь — сеть под саму модель: ввод
   * останавливает `EditableText`, но добраться до `onChange` можно и мимо него.
   */
  const field = useCallback(
    (path: string): FieldBinding => {
      const maxLength = limitFor(path)
      return {
        value: getByPath(template, path),
        maxLength,
        onChange: (value: string) =>
          setTemplate((current) => setByPath(current, path, value.slice(0, maxLength))),
      }
    },
    [template],
  )

  // Форк — единственный переход, добавляющий запись «свой лист»: «назад» из него
  // возвращает к примеру.
  const startCustom = useCallback(
    async (next: Template, nextPalette: PaletteId, nextIconSet: IconSetId) => {
      const payload = await encodeTemplate(next)
      navSeq.current += 1
      editSession.current = null
      history.pushState(
        entryState({}),
        '',
        ROUTES.sheetEdit + hashFor(payload, nextPalette, nextIconSet),
      )
      setTemplate(next)
      setFillId(null)
      // Форкнутый сезон — новый: перезаписывать им чужую (да и свою) строку нельзя.
      setSeasonId(null)
      setMode('edit')
      // Мгновенно, а не smooth: плавная прокрутка сбивается перерисовкой листа.
      scrollTo(0, 0)
    },
    [],
  )

  // «Править» — тоже переход: режим виден в адресе, поэтому «назад» из правки
  // возвращает в просмотр, а «вперёд» — обратно в правку.
  const enterEdit = useCallback(() => {
    const session = Date.now()
    // Штампуем запись просмотра тем же id, чтобы узнать её при возврате.
    history.replaceState({ ...history.state, viewOf: session }, '', location.href)
    navSeq.current += 1
    history.pushState(
      entryState({ viewOf: session, edit: true }),
      '',
      ROUTES.sheetEdit + location.hash,
    )
    editSession.current = session
    setMode('edit')
  }, [])

  const leaveEdit = useCallback(async () => {
    const marks = marksOf()
    // Запись просмотра лежит прямо под нами — возвращаемся на неё, а не плодим новую:
    // запись правки остаётся впереди, и «вперёд» продолжит прерванный сеанс.
    if (marks.edit && editSession.current !== null && marks.viewOf === editSession.current) {
      history.back()
      return
    }
    const payload = await encodeTemplate(template)
    navSeq.current += 1
    editSession.current = null
    history.pushState(
      entryState({}),
      '',
      ROUTES.sheet + hashFor(payload, palette, iconSet, null, seasonId),
    )
    setMode('view')
  }, [template, palette, iconSet, seasonId])

  /*
   * Адрес постера собирается здесь, а не читается из `location.hash`: хэш
   * отстаёт на дебаунс до 400 мс, и «Сохранить» сразу после правки положил бы
   * в базу допоследнюю версию.
   */
  const buildSeasonUrl = useCallback(async () => {
    const payload = await encodeTemplate(template)
    // Делимся тем, что на экране: у примера уезжает и его набор заполнения.
    // Форк, наоборот, `data=` сбрасывает — там начинается свой сезон.
    return ROUTES.sheet + hashFor(payload, palette, iconSet, fillId)
  }, [template, palette, iconSet, fillId])

  const value = useMemo<DocValue>(
    () => ({
      template,
      palette,
      iconSet,
      fill,
      seasonId,
      mode,
      source,
      days,
      editing: mode === 'edit',
      links: { fork: forkLink },
      field,
      setMode: (next: DocMode) => {
        if (next === mode) return
        if (next === 'edit') enterEdit()
        else void leaveEdit()
      },
      fork: () => void startCustom(structuredClone(template), palette, iconSet),
      // «Отмена» — ровно шаг назад по истории: позади лежит то, откуда пришли в правку
      // (пример при форке, лендинг у нового сезона). Своего адреса у неё поэтому нет,
      // и знать, что там за запись, не нужно — отсюда же отсутствие пометок у форка.
      cancel: () => {
        // Правку открыли прямо по ссылке — отступать некуда, уводим на лендинг.
        if (history.length <= 1) {
          location.assign(ROUTES.home)
          return
        }
        history.back()
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
      /*
       * Замена состава на свой. Карточка на каждом месте берётся прежняя, и в
       * ней меняются ровно два поля — рисунок и имя. Проект, описание и цель
       * остаются: форкают ради идей, а меняют актёрский состав.
       *
       * Место, на котором карточки не было, заполняется пустой. Лишние
       * отбрасываются сами — длину задаёт `normalizeFamily`, она же держит
       * границы 2..5 и режет имена.
       *
       * Id пересобираем `p1..pN`: старый список выбрасывается целиком, поэтому
       * `nextPersonId` здесь не нужен. `templateForFamily` не годится — она
       * возвращает весь пустой бланк и затёрла бы тему, недели и цель месяца.
       */
      replacePeople: (members: FamilyPreset) =>
        update((current) => ({
          ...current,
          people: normalizeFamily(members).map((member, index) => ({
            ...(current.people[index] ?? createPerson('', 'son')),
            id: `p${index + 1}`,
            face: member.face,
            name: member.name,
          })),
        })),
      stepMonth: (delta: number) =>
        update((current) => ({
          ...current,
          theme: { ...current.theme, ...shiftMonth(current.theme, delta) },
        })),
      setPalette,
      setIconSet,
      setSeasonId,
      // Единственное место, где собирается адрес постера. Пометки `s=` в нём нет:
      // и в базу, и в присланную ссылку едет постер, а не ссылка на кабинет.
      buildSeasonUrl,
      buildShareUrl: async () => `${location.origin}${await buildSeasonUrl()}`,
    }),
    [
      template,
      palette,
      iconSet,
      fill,
      seasonId,
      mode,
      source,
      days,
      forkLink,
      field,
      update,
      startCustom,
      enterEdit,
      leaveEdit,
      buildSeasonUrl,
    ],
  )

  return <DocContext.Provider value={value}>{children}</DocContext.Provider>
}
