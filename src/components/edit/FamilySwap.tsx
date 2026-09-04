'use client'

import { useState } from 'react'
import { AvatarFace } from '../AvatarFace'
import { Dialog } from '../dialog/Dialog'
import dialogStyles from '../dialog/Dialog.module.css'
import { faceLabels } from '../../model/accents'
import { useDict } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { useDoc, usePoster } from '../../state/docContext'
import { useFamilyPreset } from '../../state/useFamilyPreset'
import styles from './FamilySwap.module.css'

/**
 * Кнопки нет, пока состав не задан: молчание сервера значит «кнопки не будет», и
 * постер работает без него по-прежнему.
 *
 * Подтверждение обязательно: замена затирает имена с рисунками, а при меньшей
 * семье отбрасывает карточки вместе с проектами. Ради этого окно и заведено —
 * показать, что именно изменится.
 */
export function FamilySwap() {
  const { template, editing, replacePeople, lang } = useDoc()
  const family = useFamilyPreset(editing)
  const [open, setOpen] = useState(false)
  const { dialogs } = useDict()
  // Имя и подпись рисунка — часть листа, поэтому языком сезона.
  const { placeholders } = usePoster()
  const faces = faceLabels(lang)

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
        {dialogs.familySwap}
      </button>

      {open && (
        <Dialog
          title={dialogs.familyAsk}
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button type="button" className={dialogStyles.ghost} onClick={() => setOpen(false)}>
                {dialogs.cancel}
              </button>
              <button type="button" className={dialogStyles.primary} onClick={apply}>
                {dialogs.familyApply}
              </button>
            </>
          }
        >
          <div className={styles.compare}>
            <section className={styles.side}>
              <h3 className={styles.sideTitle}>{dialogs.familyNow}</h3>
              <ul className={styles.people}>
                {people.map((person) => (
                  <li className={styles.person} key={person.id}>
                    <span
                      className={styles.avatar}
                      style={{ color: `var(--person-${person.face})` }}
                    >
                      <AvatarFace variant={person.face} size={30} />
                    </span>
                    <span className={styles.name}>{person.name || placeholders.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            <span className={styles.arrow} aria-hidden="true">
              →
            </span>

            <section className={styles.side}>
              <h3 className={styles.sideTitle}>{dialogs.familyNext}</h3>
              <ul className={styles.people}>
                {family.map((member, index) => (
                  <li className={styles.person} key={index}>
                    <span
                      className={styles.avatar}
                      style={{ color: `var(--person-${member.face})` }}
                    >
                      <AvatarFace variant={member.face} size={30} />
                    </span>
                    <span className={styles.name}>{member.name || faces[member.face]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className={dialogStyles.text}>{dialogs.familyNote}</p>

          {/* Потерю карточек надо видеть заранее; рамка та же, что у «черновик
              будет затёрт» — это одно и то же предупреждение о потере. */}
          {dropped > 0 && (
            <p className={dialogStyles.warning}>
              {dropped === 1 ? dialogs.familyDropOne : fill(dialogs.familyDropMany, { n: dropped })}
            </p>
          )}
        </Dialog>
      )}
    </>
  )
}
