'use client'

import { useState } from 'react'
import { AvatarFace } from '../AvatarFace'
import { Dialog } from '../dialog/Dialog'
import dialogStyles from '../dialog/Dialog.module.css'
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
 * меньшей семье ещё и отбрасывает карточки вместе с их проектами. Ради этого
 * окно и заведено — показать **что именно** изменится; списки составов и
 * предупреждение о потере карточек рисуются своим модулем, всё остальное
 * (рамка, заголовок, ряд кнопок) — общей обвязкой окон.
 */
export function FamilySwap() {
  const { template, editing, replacePeople } = useDoc()
  const family = useFamilyPreset(editing)
  const [open, setOpen] = useState(false)

  if (!editing || !family) return null

  const people = template.people
  const dropped = people.length - family.length

  const apply = () => {
    replacePeople(family)
    setOpen(false)
  }

  return (
    <>
      <button type="button" className={styles.button} onClick={() => setOpen(true)}>
        Подставить свою семью
      </button>

      {open && (
        <Dialog
          title="Заменить героев на свою семью?"
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                onClick={() => setOpen(false)}
              >
                Отмена
              </button>
              <button type="button" className={dialogStyles.primary} onClick={apply}>
                Заменить
              </button>
            </>
          }
        >
          <div className={styles.compare}>
            <section className={styles.side}>
              <h3 className={styles.sideTitle}>Сейчас на постере</h3>
              <ul className={styles.people}>
                {people.map((person) => (
                  <li className={styles.person} key={person.id}>
                    <span
                      className={styles.avatar}
                      style={{ color: `var(--person-${person.face})` }}
                    >
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
                    <span
                      className={styles.avatar}
                      style={{ color: `var(--person-${member.face})` }}
                    >
                      <AvatarFace variant={member.face} size={30} />
                    </span>
                    <span className={styles.name}>{member.name || FACE_LABELS[member.face]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className={dialogStyles.text}>Поменяются только рисунки и имена.</p>

          {/* Ради этой строки окно и заведено: потерю карточек надо видеть заранее.
              Рамка та же, что у «черновик будет затёрт», — это одно и то же
              предупреждение о потере, и цвет светофора у него один. */}
          {dropped > 0 && (
            <p className={dialogStyles.warning}>
              {dropped === 1
                ? 'Одна нижняя карточка будет удалена.'
                : `Нижние карточки (${dropped}) будут удалены.`}
            </p>
          )}
        </Dialog>
      )}
    </>
  )
}
