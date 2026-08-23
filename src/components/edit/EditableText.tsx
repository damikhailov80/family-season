import { useEffect, useRef } from 'react'
import { useDoc } from '../../state/docContext'
import styles from './EditableText.module.css'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  /** Классы просмотра — в правке они те же, поэтому текст не «прыгает». */
  className?: string
  placeholder?: string
  /** Разрешить перевод строки (текст недели, цель месяца, описание проекта). */
  multiline?: boolean
  as?: 'span' | 'p' | 'div' | 'h1' | 'h3'
  id?: string
}

/**
 * Инлайн-редактирование прямо в вёрстке бланка.
 *
 * Поле неконтролируемое: React не переписывает текст, пока узел в фокусе, —
 * иначе на каждом вводе символа каретка прыгала бы в начало строки.
 */
export function EditableText({
  value,
  onChange,
  className,
  placeholder,
  multiline = false,
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

  const classes = [className, multiline ? styles.multiline : null, editing ? styles.editable : null]
    .filter(Boolean)
    .join(' ')

  if (!editing) {
    return (
      <Tag className={classes} id={id}>
        {value}
      </Tag>
    )
  }

  const commit = (node: HTMLElement) => {
    // innerText нормализует переводы строк contentEditable в обычные '\n'.
    const next = node.innerText.replace(/\n+$/, '')
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
      aria-multiline={multiline}
      aria-label={placeholder}
      data-placeholder={placeholder}
      tabIndex={0}
      onInput={(event: React.FormEvent<HTMLElement>) => commit(event.currentTarget)}
      onBlur={(event: React.FocusEvent<HTMLElement>) => commit(event.currentTarget)}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') event.currentTarget.blur()
        if (event.key === 'Enter' && !multiline) {
          event.preventDefault()
          event.currentTarget.blur()
        }
      }}
    />
  )
}
