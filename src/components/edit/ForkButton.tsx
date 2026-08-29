'use client'

import { useState } from 'react'
import {
  draftWillBeLost,
  readDraft,
  writeDraft,
  type Draft,
} from '../../model/draft'
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
 * остальных — черновик в браузере, и об этом окно говорит **всегда**, вместе с
 * предложением войти: копия, которую человек только что забрал себе, пропадёт от
 * чистки данных сайта, есть у него прежний черновик или нет. Красное
 * предупреждение добавляется только когда затирать действительно есть что.
 *
 * Имя спрашивается у обоих: черновик теперь тоже строка в списке на `/seasons`,
 * и безымянным ему быть незачем.
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
  /* Черновик читаем при открытии окна, а не в рендере: на сервере хранилища нет,
     и в первом проходе ответ был бы неправдой. */
  const [asking, setAsking] = useState<{ draft: Draft | null } | null>(null)
  const [busy, setBusy] = useState(false)

  const fork = async (title: string) => {
    if (!signedIn) {
      writeDraft({ title, template, palette, iconSet })
      location.assign(ROUTES.sheetEdit)
      return
    }

    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet, from })
    setBusy(false)
    setAsking(null)
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
        onClick={() => setAsking({ draft: signedIn ? null : readDraft() })}
      >
        Форкнуть
      </button>

      {asking && (
        <NewSeasonDialog
          heading="Форкнуть сезон"
          text={
            signedIn
              ? 'Копия ляжет в «Мои сезоны» — правьте её как угодно, на исходный сезон это не повлияет. Тема и рисунки уедут те, что сейчас на экране.'
              : `Копия унесёт тему и рисунки, что сейчас на экране. ${DRAFT_ONLY_HERE}`
          }
          warning={asking.draft ? draftWillBeLost(asking.draft.title) : undefined}
          offerLogin={!signedIn}
          initialTitle={defaultSeasonTitle(template)}
          busy={busy}
          onDismiss={() => setAsking(null)}
          onSubmit={(title) => void fork(title)}
        />
      )}
    </>
  )
}
