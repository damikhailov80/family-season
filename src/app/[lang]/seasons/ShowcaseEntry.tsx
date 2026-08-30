'use client'

import { useState, useTransition } from 'react'
import { Dialog } from '../../../components/dialog/Dialog'
import dialogStyles from '../../../components/dialog/Dialog.module.css'
import { MegaphoneDoodle } from '../../../components/doodles'
import { useDict } from '../../../i18n/context'
import { fill } from '../../../i18n/fill'
import type { Lang } from '../../../model/lang'
import { republishEntry, withdrawEntry } from '../../../server/actions'
import styles from './page.module.css'

/**
 * Витрина под своей публикацией — прямо из списка, в обе стороны.
 *
 * Значок тот же, что на самом сезоне, и повадка та же: мегафон нажат
 * (`aria-pressed`), пока сезон на витрине, и снимает его; отжатый возвращает
 * обратно. Крестик здесь стоял, пока кнопка умела одно движение, — а «убрать» и
 * «вернуть» одним крестиком не показать, да и в двух местах про одно и то же
 * незачем говорить двумя разными значками.
 *
 * Спрашиваем только про снятие: что случится со строкой, зависит не только от
 * автора — отложил кто-то сезон в избранное, и он останется жить по ссылке; не
 * отложил никто — исчезнет вместе с лайками. Возврат не спрашивает ничего:
 * строка та же самая, и терять нечего.
 *
 * Ожидание держит `useTransition`: действие кончается редиректом, а компонент от
 * этого не монтируется заново — свой флажок «убираем» так и остался бы поднятым
 * (та же ловушка, что в `RenameEntry`).
 */
export function ShowcaseEntry({
  code,
  title,
  hidden,
  back,
  lang,
}: {
  code: string
  title: string
  /** Снят с витрины: кнопка отжата и возвращает сезон обратно. */
  hidden: boolean
  back: string
  lang: Lang
}) {
  const [open, setOpen] = useState(false)
  const [busy, start] = useTransition()
  const { seasons, dialogs } = useDict()
  const label = fill(hidden ? seasons.showcaseOffOne : seasons.showcaseOnOne, { title })

  return (
    <>
      <button
        type="button"
        className={styles.rowButton}
        onClick={() => (hidden ? start(() => republishEntry(code, back, lang)) : setOpen(true))}
        disabled={busy}
        aria-pressed={!hidden}
        title={label}
        aria-label={label}
      >
        <MegaphoneDoodle size={17} strokeWidth={4} />
      </button>

      {open && (
        <Dialog
          title={dialogs.withdraw}
          onDismiss={() => setOpen(false)}
          actions={
            <>
              <button
                type="button"
                className={dialogStyles.ghost}
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {dialogs.cancel}
              </button>
              <button
                type="button"
                className={dialogStyles.primary}
                disabled={busy}
                onClick={() => {
                  setOpen(false)
                  start(() => withdrawEntry(code, back, lang))
                }}
              >
                {dialogs.withdrawAction}
              </button>
            </>
          }
        >
          <p className={dialogStyles.text}>{fill(seasons.withdrawAskOne, { title })}</p>
          {/* Приписка та же, что в окне у самого сезона, и оттуда же: «убрать» —
              не «удалить», отложенный кем-то сезон никуда не денется. */}
          <p className={dialogStyles.text}>{dialogs.withdrawNote}</p>
        </Dialog>
      )}
    </>
  )
}
