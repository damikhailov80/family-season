import { useEffect, useRef, useState } from 'react'
import { useDoc } from '../../state/docContext'
import styles from './EditableText.module.css'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  /** Сколько символов помещается в это место на бумаге (`src/model/limits.ts`). */
  maxLength: number
  /** Классы просмотра — в правке они те же, поэтому текст не «прыгает». */
  className?: string
  placeholder?: string
  as?: 'span' | 'p' | 'div' | 'h1' | 'h3'
  id?: string
}

/** Сколько держится вспышка отказа, мс. */
const FLASH_MS = 220

/** Переносы строк в поля бланка не попадают: схлопываем их в пробел. */
function singleLine(value: string): string {
  return value.replace(/\n+$/, '').replace(/\s*\n+\s*/g, ' ')
}

/** Длина выделения внутри узла: набранное поверх него места не занимает. */
function selectionLength(node: HTMLElement): number {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return 0
  if (!node.contains(selection.anchorNode)) return 0
  return selection.toString().length
}

/** Каретка в конец узла — после того, как мы переписали его текст руками. */
function caretToEnd(node: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  const selection = getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/**
 * Инлайн-редактирование прямо в вёрстке бланка.
 *
 * Поле неконтролируемое: React не переписывает текст, пока узел в фокусе, —
 * иначе на каждом вводе символа каретка прыгала бы в начало строки.
 *
 * Все поля бланка однострочные. Перевод строки — это ручная вёрстка: ею
 * подгоняют текст под рамку, лист от неё растёт без предела и разъезжается на
 * лишние страницы при печати. Высоту блоков задаёт макет, перенос — браузер.
 *
 * По той же причине у каждого поля есть предел длины: место на бумаге посчитано
 * (`src/model/limits.ts`), и текст сверх него — это лишние строки, а в карточке
 * человека они ещё и умножаются на пять. Предел жёсткий: ввод просто не проходит,
 * зато на бумагу заведомо попадает то же, что на экране. Чтобы отказ не выглядел
 * поломкой, поле на мгновение вспыхивает подчёркиванием.
 *
 * Обязательных полей на бланке нет, но и пустых тоже: незаполненное поле вне
 * правки показывает свою подсказку как обычный текст — и она же уходит на
 * бумагу. Поэтому вписывать всё подряд не нужно, а дырок в макете не бывает.
 */
export function EditableText({
  value,
  onChange,
  maxLength,
  className,
  placeholder,
  as = 'span',
  id,
}: EditableTextProps) {
  const { editing } = useDoc()
  const ref = useRef<HTMLElement>(null)
  const [full, setFull] = useState(false)
  const Tag = as as React.ElementType

  useEffect(() => {
    const node = ref.current
    if (!node || !editing) return
    if (document.activeElement !== node && node.innerText !== value) {
      node.innerText = value
    }
  }, [value, editing])

  // Вспышка гаснет сама. Таймер снимается, иначе он дёрнет размонтированный узел.
  useEffect(() => {
    if (!full) return
    const timer = setTimeout(() => setFull(false), FLASH_MS)
    return () => clearTimeout(timer)
  }, [full])

  const classes = [className, editing ? styles.editable : null, full ? styles.full : null]
    .filter(Boolean)
    .join(' ')

  if (!editing) {
    return (
      <Tag className={classes} id={id}>
        {value || placeholder}
      </Tag>
    )
  }

  const commit = (node: HTMLElement) => {
    // innerText нормализует переводы строк contentEditable в обычные '\n'.
    const next = singleLine(node.innerText).slice(0, maxLength)
    // Сеть под редкие пути мимо beforeinput — перетаскивание текста, автозамена, IME.
    // Только здесь мы трогаем узел в фокусе: иначе экран разошёлся бы с моделью и
    // показывал бы текст, которого на бумаге не будет.
    if (node.innerText !== next) {
      node.innerText = next
      if (document.activeElement === node) caretToEnd(node)
      setFull(true)
    }
    if (next !== value) onChange(next)
  }

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      id={id}
      className={classes}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={false}
      aria-label={placeholder}
      data-placeholder={placeholder}
      tabIndex={0}
      /*
       * Единственная проверка длины при вводе — здесь: сюда приходит и набор с
       * клавиатуры, и вставка, и перетаскивание текста, и подтверждение IME.
       */
      onBeforeInput={(event: React.InputEvent<HTMLElement>) => {
        const node = event.currentTarget
        // Удаления данных не несут и проходят всегда; считаем только вставляемое.
        const inserted = event.data ? event.data.length : 0
        if (!inserted) return
        const room = maxLength - node.innerText.length + selectionLength(node)
        if (inserted <= room) return
        event.preventDefault()
        setFull(true)
        // Кладём то, что влезает, а не отбрасываем всё: набранное начало и остаток
        // под правку привычнее пустого поля. Вложенный insertText сюда же и придёт,
        // но он уже по размеру — рекурсии не будет.
        if (room > 0) document.execCommand('insertText', false, event.data.slice(0, room))
      }}
      onInput={(event: React.InputEvent<HTMLElement>) => commit(event.currentTarget)}
      onBlur={(event: React.FocusEvent<HTMLElement>) => commit(event.currentTarget)}
      onPaste={(event: React.ClipboardEvent<HTMLElement>) => {
        // Вставка — единственный оставшийся способ занести перевод строки
        // (Enter перехвачен ниже). Кладём текст одной строкой сразу, иначе узел
        // вырастет на экране, хотя модель переносы всё равно схлопнет.
        event.preventDefault()
        // Длину отмерит beforeinput — он ловит и этот insertText тоже.
        // execCommand устарел, но это единственный способ вставить текст,
        // не потеряв историю отмены contentEditable.
        document.execCommand('insertText', false, singleLine(event.clipboardData.getData('text/plain')))
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') event.currentTarget.blur()
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
    />
  )
}
