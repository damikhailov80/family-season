'use client'

import { useActionState, useEffect, useState } from 'react'
import { AvatarFace } from '../../components/AvatarFace'
import { FACE_LABELS, nextFace } from '../../model/accents'
import { NAME_LIMIT, type FamilyPreset } from '../../model/family'
import { MAX_PEOPLE, MIN_PEOPLE } from '../../model/types'
import { saveFamily } from '../../server/actions'
import type { FamilyStatus } from '../../server/settings'
import { Toast } from '../../components/site/Toast'
import styles from './page.module.css'

/**
 * Что сказать, когда сохранить не вышло. Успеха здесь нет: он уводит редиректом
 * и показывается уже страницей.
 */
const FAILURE_TEXT: Record<Exclude<FamilyStatus, 'ok'>, string> = {
  error: 'Не удалось сохранить настройки — ошибка на сервере. Попробуйте ещё раз.',
  stale:
    'Не удалось сохранить: вход был выполнен до того, как появились настройки. Обновите страницу и войдите заново.',
  anonymous: 'Не удалось сохранить: сеанс закончился. Обновите страницу и войдите снова.',
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
    async () => ({ status: await saveFamily(people), at: Date.now() }),
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
      current.map((person, i) => (i === index ? { ...person, face: nextFace(person.face) } : person)),
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
              title="Сменить рисунок"
              aria-label={`Рисунок: ${FACE_LABELS[person.face]}. Сменить`}
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
              placeholder="Имя"
              aria-label={`Имя: ${FACE_LABELS[person.face]}`}
            />

            {people.length > MIN_PEOPLE && (
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(index)}
                title="Убрать из состава"
                aria-label={`Убрать: ${person.name || FACE_LABELS[person.face]}`}
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
            + Добавить человека
          </button>
        )}
        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>

      {/* Ошибка сервера — тост, набранный состав остаётся в форме нетронутым:
          повторяют отсюда же, не сходя со страницы. */}
      {failure && <Toast key={failure.at} message={FAILURE_TEXT[failure.status]} />}
    </form>
  )
}
