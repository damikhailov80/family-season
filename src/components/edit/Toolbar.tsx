import { useEffect, useState } from 'react'
import { useDoc } from '../../state/docContext'
import styles from './Toolbar.module.css'

/**
 * Переходы между примером и своим листом — настоящие ссылки: клик с модификатором
 * или средней кнопкой должен открывать лист в новой вкладке, как на любом сайте.
 * Обычный левый клик перехватываем — переход делается на месте, без перезагрузки.
 */
function onNavClick(action: () => void) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    action()
  }
}

export function Toolbar() {
  const { source, editing, setMode, fork, openDemo, links, buildShareUrl } = useDoc()
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
          <span className={styles.hint}>
            Это пример сезона — форкните его и перепишите под свою семью
          </span>
          {/* href появляется после кодирования; обычный клик работает и без него. */}
          <a className={styles.primary} href={links.fork || undefined} onClick={onNavClick(fork)}>
            Форкнуть пример
          </a>
        </>
      ) : (
        <>
          <span className={styles.hint}>
            {editing ? 'Правьте текст прямо на постере' : 'Ваш сезон — ссылка хранит его целиком'}
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
          <a className={styles.ghost} href={links.demo} onClick={onNavClick(openDemo)}>
            К примеру
          </a>
        </>
      )}
      <button type="button" className={styles.ghost} onClick={() => print()}>
        Печать / PDF
      </button>
    </div>
  )
}
