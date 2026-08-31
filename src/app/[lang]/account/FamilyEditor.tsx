'use client'

import { useActionState, useEffect, useState } from 'react'
import { AvatarFace } from '../../../components/AvatarFace'
import { useDict, useLang } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import { faceLabels, nextFace } from '../../../model/accents'
import { NAME_LIMIT, type FamilyPreset } from '../../../model/family'
import { MAX_PEOPLE, MIN_PEOPLE } from '../../../model/types'
import { saveFamily } from '../../../server/actions'
import type { FamilyStatus } from '../../../server/settings'
import type { Dict } from '../../../i18n/types'
import { Toast } from '../../../components/site/Toast'
import styles from './page.module.css'

/**
 * Что сказать, когда сохранить не вышло. Успеха здесь нет: он уводит редиректом
 * и показывается уже страницей.
 */
function failureText(status: Exclude<FamilyStatus, 'ok'>, account: Dict['account']): string {
  if (status === 'error') return account.saveFailedError
  return status === 'stale' ? account.saveFailedStale : account.saveFailedAnonymous
}

/**
 * Редактор состава семьи. Повадка намеренно та же, что у секции «Личные проекты»
 * на постере (`ProjectsSection`): клик по аватару перебирает рисунок, имя правится
 * на месте, «×» убирает, «+» добавляет. Человек уже знает этот жест по постеру —
 * второй способ делать то же самое только сбивал бы.
 *
 * Это первый клиентский компонент сайта вне постера, и заведён он сознательно:
 * без JS каждый клик по аватару стоил бы перезагрузки страницы.
 *
 * Состав уезжает на сервер **аргументом действия**, а не полями формы: React
 * переименовывает поля формы, отправленной из клиентского компонента (`_1_name`
 * вместо `name`), и разбор `FormData` на сервере молча получал бы пустоту.
 *
 * Логику `ProjectsSection` переиспользовать нельзя: она завязана на `useDoc`,
 * то есть на документ постера, которого здесь нет.
 */
interface Failure {
  status: Exclude<FamilyStatus, 'ok'>
  at: number
}

export function FamilyEditor({ initial }: { initial: FamilyPreset }) {
  const [people, setPeople] = useState<FamilyPreset>(initial)
  const lang = useLang()
  const { account } = useDict()
  // Подписи рисунков — часть словаря постера, но здесь листа нет вовсе, и берём
  // их языком интерфейса: кабинет говорит с человеком, а не печатается.
  const faces = faceLabels(lang)

  /*
   * `useActionState`, а не `useTransition`: действие возвращает статус неудачи
   * вместо редиректа, и его надо куда-то положить. Успех сюда не приходит —
   * `saveFamily` уводит на `?ok=1`, и компонент размонтируется.
   *
   * Рядом со статусом едет отметка времени: сама по себе строка `error` при
   * второй неудаче подряд не меняется, тост не перемонтировался бы и повторный
   * отказ прошёл бы незамеченным. По ней и ставится `key`.
   */
  const [failure, save, saving] = useActionState<Failure | null, FormData>(
    async () => ({ status: await saveFamily(people, lang), at: Date.now() }),
    null,
  )

  /*
   * `?ok=1` нужен ровно на один рендер: он донёс «Сохранено ✓» через редирект.
   * Дальше он врёт — перезагрузка показывала бы «Сохранено» и через час. Плашку
   * это не гасит: она уже нарисована сервером, а React перерисовки не делает.
   * `history.state` передаём целиком: `null` затёр бы служебные поля Next.
   */
  useEffect(() => {
    const url = new URL(location.href)
    if (!url.searchParams.has('ok')) return
    url.searchParams.delete('ok')
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const cycle = (index: number) =>
    setPeople((current) =>
      current.map((person, i) =>
        i === index ? { ...person, face: nextFace(person.face) } : person,
      ),
    )

  const rename = (index: number, name: string) =>
    setPeople((current) => current.map((person, i) => (i === index ? { ...person, name } : person)))

  const remove = (index: number) =>
    setPeople((current) =>
      current.length <= MIN_PEOPLE ? current : current.filter((_, i) => i !== index),
    )

  const add = () =>
    setPeople((current) =>
      current.length >= MAX_PEOPLE ? current : [...current, { face: 'son', name: '' }],
    )

  return (
    <form className={styles.family} action={save}>
      <ul className={styles.people}>
        {people.map((person, index) => (
          <li className={styles.person} key={index}>
            <button
              type="button"
              className={styles.avatarButton}
              style={{ color: `var(--person-${person.face})` }}
              onClick={() => cycle(index)}
              title={account.changeFace}
              aria-label={fill(account.faceAria, { face: faces[person.face] })}
            >
              <AvatarFace variant={person.face} size={44} />
            </button>

            {/* Кто это, видно по рисунку — подписи под именем не нужно.
                В `aria-label` она остаётся: скринридер картинку не видит. */}
            <input
              className={styles.nameInput}
              value={person.name}
              onChange={(event) => rename(index, event.target.value)}
              maxLength={NAME_LIMIT}
              placeholder={account.namePlaceholder}
              aria-label={fill(account.nameAria, { face: faces[person.face] })}
            />

            {people.length > MIN_PEOPLE && (
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(index)}
                title={account.removeTitle}
                aria-label={fill(account.removeAria, { name: person.name || faces[person.face] })}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.familyActions}>
        {people.length < MAX_PEOPLE && (
          <button type="button" className={styles.add} onClick={add}>
            {account.addPerson}
          </button>
        )}
        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? account.saving : account.saveFamily}
        </button>
      </div>

      {/* Ошибка сервера — тост, набранный состав остаётся в форме нетронутым:
          повторяют отсюда же, не сходя со страницы. */}
      {failure && <Toast key={failure.at} message={failureText(failure.status, account)} />}
    </form>
  )
}
