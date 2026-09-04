'use client'

import { useActionState, useEffect, useState } from 'react'
import { AvatarFace } from '../../../components/AvatarFace'
import { useDict, useLang } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import { faceLabels, nextFace } from '../../../model/accents'
import { familyNamed, NAME_LIMIT, type FamilyPreset } from '../../../model/family'
import { MAX_PEOPLE, MIN_PEOPLE } from '../../../model/types'
import { saveFamily } from '../../../server/actions'
import type { SaveFamilyStatus } from '../../../server/settings'
import type { Dict } from '../../../i18n/types'
import { Toast } from '../../../components/site/Toast'
import styles from './page.module.css'

function failureText(status: SaveFamilyStatus, account: Dict['account']): string {
  if (status === 'unnamed') return account.saveFailedUnnamed
  if (status === 'error') return account.saveFailedError
  return status === 'stale' ? account.saveFailedStale : account.saveFailedAnonymous
}

interface Failure {
  status: SaveFamilyStatus
  at: number
}

export function FamilyEditor({ initial }: { initial: FamilyPreset }) {
  const [people, setPeople] = useState<FamilyPreset>(initial)
  const lang = useLang()
  const { account } = useDict()
  const faces = faceLabels(lang)

  const named = familyNamed(people)

  const [failure, save, saving] = useActionState<Failure | null, FormData>(
    async () => ({ status: await saveFamily(people, lang), at: Date.now() }),
    null,
  )

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
        <button type="submit" className={styles.primary} disabled={saving || !named}>
          {saving ? account.saving : account.saveFamily}
        </button>
      </div>

      {failure && <Toast key={failure.at} message={failureText(failure.status, account)} />}
    </form>
  )
}
