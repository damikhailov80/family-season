'use client'

import { useState, useTransition } from 'react'
import { AvatarFace } from '../../components/AvatarFace'
import { FACE_LABELS, nextFace } from '../../model/accents'
import { NAME_LIMIT, type FamilyPreset } from '../../model/family'
import { MAX_PEOPLE, MIN_PEOPLE } from '../../model/types'
import { saveFamily } from '../../server/actions'
import styles from './page.module.css'

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
export function FamilyEditor({ initial }: { initial: FamilyPreset }) {
  const [people, setPeople] = useState<FamilyPreset>(initial)
  const [saving, startSaving] = useTransition()

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
    <form
      className={styles.family}
      onSubmit={(event) => {
        event.preventDefault()
        startSaving(() => saveFamily(people))
      }}
    >
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
    </form>
  )
}
