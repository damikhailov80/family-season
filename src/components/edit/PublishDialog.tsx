'use client'

import { useRef } from 'react'
import { Dialog } from '../dialog/Dialog'
import styles from '../dialog/Dialog.module.css'
import { useDict, useLang } from '../../i18n/context'
import { publishText, type PublishStatus } from '../../model/community'
import { LANG_LABELS, LANGS, type Lang } from '../../model/lang'
import { publicSeasonHref } from '../../model/site'

/**
 * Выложить сезон на витрину.
 *
 * Окно спрашивает подтверждение и предлагает обезличить имена — и больше ничего.
 * Что на витрину уезжает **копия**, что связь с этим сезоном обрывается и что
 * одинакового контента витрина не держит, в тексте не разбирается: это устройство
 * сайта (см. «Витрина» в CLAUDE.md), а не забота нажимающего.
 *
 * Галочка обезличивания стоит здесь же, а не в настройках: решение принимают
 * про конкретный сезон, а не вообще. Имена подменяются только в копии — свой
 * сезон остаётся с настоящими.
 *
 * **Ответ витрины приходит до нажатия, а не после.** Пока идёт проверка
 * (`check === null`), кнопка ждёт; нашёлся такой же сезон — окно говорит об этом
 * сразу и, если ему есть куда вести, предлагает посмотреть. Прежде человек
 * заполнял окно, жал «Выложить» и только тогда получал отказ тостом.
 *
 * Своей беды проверка не показывает: не ответила база — окно ведёт себя как
 * раньше, а отказ, если он будет, объяснит сама публикация.
 *
 * **Язык выбирают здесь.** Умолчание — язык самого сезона: им подписан лист, и
 * менять его при публикации обычно незачем. Но сезон, собранный по-русски для
 * англоязычной витрины, — законный случай, и списка ради него довольно.
 * Смена языка **пересчитывает проверку**: уникальность считается вместе с
 * языком, и тот же бланк в другом языке дублем уже не будет.
 */
export function PublishDialog({
  check,
  busy,
  seasonLang,
  onLangChange,
  onDismiss,
  onSubmit,
}: {
  /** Что показала проверка витрины; `null` — ещё проверяем. */
  check: { status: PublishStatus; code?: string } | null
  busy: boolean
  /** Язык, с которым сезон уедет на витрину. Изначально — язык самого сезона. */
  seasonLang: Lang
  onLangChange: (lang: Lang) => void
  onDismiss: () => void
  onSubmit: (anonymize: boolean) => void
}) {
  const anonymize = useRef<HTMLInputElement>(null)
  const { dialogs } = useDict()
  const lang = useLang()

  const refusal =
    check?.status === 'duplicate' || check?.status === 'blocked' || check?.status === 'limit'
      ? publishText(lang, check.status)
      : null

  if (refusal) {
    return (
      <Dialog
        title={dialogs.publish}
        onDismiss={onDismiss}
        actions={
          // Отменять тут нечего: ничего не случится в любом случае, и кнопка
          // остаётся одна.
          <button type="button" className={styles.primary} onClick={onDismiss}>
            {dialogs.close}
          </button>
        }
      >
        <p className={styles.text}>{refusal}</p>
        {/* Ссылка есть не всегда: у снятого с витрины сезона места нет, и
            вести туда незачем — на витрине его не увидят.

            Язык в адресе — выкладываемого сезона: дубль всегда в том же языке,
            уникальность считается вместе с ним. */}
        {check.code && (
          <a className={styles.link} href={publicSeasonHref(seasonLang, check.code)}>
            {dialogs.publishSeeIt}
          </a>
        )}
      </Dialog>
    )
  }

  return (
    <Dialog
      title={dialogs.publish}
      onDismiss={onDismiss}
      actions={
        <>
          <button type="button" className={styles.ghost} onClick={onDismiss} disabled={busy}>
            {dialogs.cancel}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSubmit(Boolean(anonymize.current?.checked))}
            disabled={busy || !check}
          >
            {busy ? dialogs.publishing : check ? dialogs.publishAction : dialogs.publishChecking}
          </button>
        </>
      }
    >
      <p className={styles.text}>{dialogs.publishHint}</p>

      <label className={styles.label} htmlFor="publish-lang">
        {dialogs.publishLangLabel}
      </label>
      <select
        className={styles.select}
        id="publish-lang"
        value={seasonLang}
        onChange={(event) => onLangChange(event.target.value as Lang)}
        disabled={busy}
      >
        {LANGS.map((item) => (
          <option key={item} value={item}>
            {LANG_LABELS[item]}
          </option>
        ))}
      </select>

      <label className={styles.check}>
        <input className={styles.checkBox} ref={anonymize} type="checkbox" />
        <span>{dialogs.publishAnonymize}</span>
      </label>
    </Dialog>
  )
}
