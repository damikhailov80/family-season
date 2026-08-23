import { useEffect, useState } from 'react'
import { useDoc } from '../../state/docContext'
import styles from './Toolbar.module.css'

export function Toolbar() {
  const { source, editing, setMode, fork, startBlank, continueDraft, openDemo, hasDraft, buildShareUrl } =
    useDoc()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const copyLink = async () => {
    const url = await buildShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Без разрешения на буфер — показываем ссылку, скопирует руками.
      prompt('Ссылка на лист:', url)
    }
  }

  return (
    <div className={styles.bar} role="toolbar" aria-label="Действия с листом">
      {source === 'demo' ? (
        <>
          <span className={styles.hint}>Это пример — форкните его или начните с чистого листа</span>
          <button type="button" className={styles.primary} onClick={fork}>
            Форкнуть пример
          </button>
          <button type="button" className={styles.ghost} onClick={startBlank}>
            Создать с нуля
          </button>
          {hasDraft && (
            <button type="button" className={styles.ghost} onClick={continueDraft}>
              Продолжить правку
            </button>
          )}
        </>
      ) : (
        <>
          <span className={styles.hint}>
            {editing ? 'Правьте текст прямо на листе' : 'Ваш лист — ссылка хранит его целиком'}
          </span>
          <button
            type="button"
            className={editing ? styles.primary : styles.ghost}
            onClick={() => setMode(editing ? 'view' : 'edit')}
          >
            {editing ? 'Готово' : 'Править'}
          </button>
          <button type="button" className={styles.ghost} onClick={() => void copyLink()}>
            {copied ? 'Скопировано ✓' : 'Скопировать ссылку'}
          </button>
          <button type="button" className={styles.ghost} onClick={openDemo}>
            К примеру
          </button>
        </>
      )}
      <button type="button" className={styles.ghost} onClick={() => print()}>
        Печать / PDF
      </button>
    </div>
  )
}
