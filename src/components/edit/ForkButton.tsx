'use client'

import { useState } from 'react'
import { readDraft, writeDraft } from '../../model/draft'
import { defaultSeasonTitle, LIBRARY_TEXT } from '../../model/library'
import { ROUTES, seasonHref } from '../../model/site'
import { storeSeason } from '../../server/actions'
import { useDoc } from '../../state/docContext'
import { NewSeasonDialog } from './NewSeasonDialog'
import styles from './Bar.module.css'

/**
 * «Форкнуть» — кнопка и окно к ней. Одна на все чужие постеры: выложенный и
 * присланный по личной ссылке форкаются одинаково, и разводить это по двум
 * панелям значило бы держать две копии одного разговора.
 *
 * Форк копирует **то, что на экране**, вместе с примеренной темой и набором
 * рисунков: человек берёт себе увиденное, а не строку из базы. Слой заполнения
 * не копируется никогда — он не часть бланка.
 *
 * Куда ложится копия, решает вход, и он известен заранее: страницы постера
 * серверные и передают ответ пропом. У вошедшего — строка в кабинете, у
 * остальных — черновик в браузере; черновик там один, поэтому окно
 * предупреждает, что прежний заменится.
 *
 * Окно рисуется прямо здесь, внутри бара, и это можно: модальный `<dialog>`
 * живёт в верхнем слое, и `backdrop-filter` бара ему не помеха — в отличие от
 * тоста, который остался бы приклеенным к панели. Поэтому об отказе кнопка не
 * рассказывает сама, а отдаёт его наружу.
 */
export function ForkButton({
  signedIn,
  from,
  onFailure,
}: {
  signedIn: boolean
  /** Код выложенного сезона, если форкают его: нужен статистике автора. */
  from?: string
  onFailure: (text: string) => void
}) {
  const { template, palette, iconSet } = useDoc()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const fork = async (title: string) => {
    if (!signedIn) {
      writeDraft({ template, palette, iconSet })
      location.assign(ROUTES.sheetEdit)
      return
    }

    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet, from })
    setBusy(false)
    setOpen(false)
    if (result.status === 'ok' && result.code) {
      location.assign(seasonHref(result.code, 'edit'))
      return
    }
    // `anonymous` сюда не приходит: вход у страницы спрошен заранее.
    onFailure(LIBRARY_TEXT[result.status as 'limit' | 'stale' | 'error'])
  }

  return (
    <>
      <button
        type="button"
        className={styles.primary}
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Форкнуть
      </button>

      {open && (
        <NewSeasonDialog
          heading="Форкнуть сезон"
          text={
            signedIn
              ? 'Копия ляжет в «Мои сезоны» — правьте её как угодно, на исходный сезон это не повлияет. Тема и рисунки уедут те, что сейчас на экране.'
              : readDraft()
                ? 'Копия ляжет черновиком в этот браузер. Черновик здесь один — то, что вы набирали раньше, заменится. Войдите, и сезоны будут храниться в вашей коллекции.'
                : 'Копия ляжет черновиком в этот браузер — он живёт только здесь. Войдите, и сезоны будут храниться в вашей коллекции.'
          }
          initialTitle={signedIn ? defaultSeasonTitle(template) : null}
          busy={busy}
          onDismiss={() => setOpen(false)}
          onSubmit={(title) => void fork(title)}
        />
      )}
    </>
  )
}
