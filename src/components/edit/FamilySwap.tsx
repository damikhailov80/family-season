'use client'

import { useRef } from 'react'
import { AvatarFace } from '../AvatarFace'
import { FACE_LABELS } from '../../model/accents'
import { PLACEHOLDERS } from '../../model/labels'
import { useDoc } from '../../state/docContext'
import { useFamilyPreset } from '../../state/useFamilyPreset'
import styles from './FamilySwap.module.css'

/**
 * «Подставить свою семью» — состав из кабинета вместо героев форкнутого сезона.
 *
 * Кнопки нет, пока состав не задан: спрашивать его лист начинает только в
 * правке, а молчание сервера (не вошёл, база молчит) значит «кнопки не будет».
 * Поэтому постер по-прежнему работает без сервера — просто без этой кнопки.
 *
 * Подтверждение обязательно: действие затирает имена с рисунками, а при
 * меньшей семье ещё и отбрасывает карточки вместе с их проектами. Диалог —
 * нативный `<dialog>` с `showModal()`, первый в проекте. `confirm()` не годится:
 * он вешает вкладку, ломает автоматическую проверку и не умеет показать
 * главное — **что именно** изменится.
 */
export function FamilySwap() {
  const { template, editing, replacePeople } = useDoc()
  const family = useFamilyPreset(editing)
  const dialog = useRef<HTMLDialogElement>(null)

  if (!editing || !family) return null

  const people = template.people
  const dropped = people.length - family.length

  const apply = () => {
    replacePeople(family)
    dialog.current?.close()
  }

  return (
    <>
      <button type="button" className={styles.button} onClick={() => dialog.current?.showModal()}>
        Подставить свою семью
      </button>

      <dialog className={styles.dialog} ref={dialog} aria-labelledby="family-swap-title">
        <h2 className={styles.title} id="family-swap-title">
          Заменить героев на свою семью?
        </h2>

        <div className={styles.compare}>
          <section className={styles.side}>
            <h3 className={styles.sideTitle}>Сейчас на постере</h3>
            <ul className={styles.people}>
              {people.map((person) => (
                <li className={styles.person} key={person.id}>
                  <span className={styles.avatar} style={{ color: `var(--person-${person.face})` }}>
                    <AvatarFace variant={person.face} size={30} />
                  </span>
                  <span className={styles.name}>{person.name || PLACEHOLDERS.name}</span>
                </li>
              ))}
            </ul>
          </section>

          <span className={styles.arrow} aria-hidden="true">
            →
          </span>

          <section className={styles.side}>
            <h3 className={styles.sideTitle}>Станет</h3>
            <ul className={styles.people}>
              {family.map((member, index) => (
                <li className={styles.person} key={index}>
                  <span className={styles.avatar} style={{ color: `var(--person-${member.face})` }}>
                    <AvatarFace variant={member.face} size={30} />
                  </span>
                  <span className={styles.name}>{member.name || FACE_LABELS[member.face]}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className={styles.text}>
          Проекты, описания и цели останутся на своих местах — поменяются только рисунки и имена.
        </p>

        {/* Ради этой строки диалог и заведён: потерю карточек надо видеть заранее. */}
        {dropped > 0 && (
          <p className={styles.warn}>
            {dropped === 1
              ? 'Одна нижняя карточка будет отброшена вместе с проектом и целью.'
              : `Нижние карточки (${dropped}) будут отброшены вместе с проектами и целями.`}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={() => dialog.current?.close()}>
            Отмена
          </button>
          <button type="button" className={styles.primary} onClick={apply}>
            Заменить
          </button>
        </div>
      </dialog>
    </>
  )
}
