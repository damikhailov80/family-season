import { useEffect, useRef } from 'react'
import { useDoc } from '../../state/docContext'
import styles from './EditableText.module.css'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  /** Классы просмотра — в правке они те же, поэтому текст не «прыгает». */
  className?: string
  placeholder?: string
  as?: 'span' | 'p' | 'div' | 'h1' | 'h3'
  id?: string
}

/** Переносы строк в поля бланка не попадают: схлопываем их в пробел. */
function singleLine(value: string): string {
  return value.replace(/\n+$/, '').replace(/\s*\n+\s*/g, ' ')
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
 */
export function EditableText({
  value,
  onChange,
  className,
  placeholder,
  as = 'span',
  id,
}: EditableTextProps) {
  const { editing } = useDoc()
  const ref = useRef<HTMLElement>(null)
  const Tag = as as React.ElementType

  useEffect(() => {
    const node = ref.current
    if (!node || !editing) return
    if (document.activeElement !== node && node.innerText !== value) {
      node.innerText = value
    }
  }, [value, editing])

  const classes = [className, editing ? styles.editable : null].filter(Boolean).join(' ')

  if (!editing) {
    return (
      <Tag className={classes} id={id}>
        {value}
      </Tag>
    )
  }

  const commit = (node: HTMLElement) => {
    // innerText нормализует переводы строк contentEditable в обычные '\n'.
    const next = singleLine(node.innerText)
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
      onInput={(event: React.FormEvent<HTMLElement>) => commit(event.currentTarget)}
      onBlur={(event: React.FocusEvent<HTMLElement>) => commit(event.currentTarget)}
      onPaste={(event: React.ClipboardEvent<HTMLElement>) => {
        // Вставка — единственный оставшийся способ занести перевод строки
        // (Enter перехвачен ниже). Кладём текст одной строкой сразу, иначе узел
        // вырастет на экране, хотя модель переносы всё равно схлопнет.
        event.preventDefault()
        const text = singleLine(event.clipboardData.getData('text/plain'))
        // execCommand устарел, но это единственный способ вставить текст,
        // не потеряв историю отмены contentEditable.
        document.execCommand('insertText', false, text)
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
