import { useEffect, useRef, useState } from 'react'
import { useDoc } from '../../state/docContext'
import styles from './EditableText.module.css'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  className?: string
  placeholder?: string
  as?: 'span' | 'p' | 'div' | 'h1' | 'h3'
  id?: string
}

const FLASH_MS = 220

function singleLine(value: string): string {
  return value.replace(/\n+$/, '').replace(/\s*\n+\s*/g, ' ')
}

function selectionLength(node: HTMLElement): number {
  const selection = getSelection()
  if (!selection || selection.rangeCount === 0) return 0
  if (!node.contains(selection.anchorNode)) return 0
  return selection.toString().length
}

function caretToEnd(node: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  const selection = getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

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

  // The node is uncontrolled: render the text into children and the caret jumps
  // back to the start on every keystroke.
  useEffect(() => {
    const node = ref.current
    if (!node || !editing) return
    if (document.activeElement !== node && node.innerText !== value) {
      node.innerText = value
    }
  }, [value, editing])

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
    const next = singleLine(node.innerText).slice(0, maxLength)
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
      onBeforeInput={(event: React.InputEvent<HTMLElement>) => {
        const node = event.currentTarget
        const inserted = event.data ? event.data.length : 0
        if (!inserted) return
        const room = maxLength - node.innerText.length + selectionLength(node)
        if (inserted <= room) return
        event.preventDefault()
        setFull(true)
        if (room > 0) document.execCommand('insertText', false, event.data.slice(0, room))
      }}
      onInput={(event: React.InputEvent<HTMLElement>) => commit(event.currentTarget)}
      onBlur={(event: React.FocusEvent<HTMLElement>) => commit(event.currentTarget)}
      onPaste={(event: React.ClipboardEvent<HTMLElement>) => {
        event.preventDefault()
        document.execCommand(
          'insertText',
          false,
          singleLine(event.clipboardData.getData('text/plain')),
        )
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
