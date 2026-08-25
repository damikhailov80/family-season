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

/**
 * Состояний у постера три — пример, свой сезон в просмотре и он же в правке, — и
 * тулбар собран по строкам их матрицы действий, а не вложенными тернарниками:
 * каждое условие ниже отвечает ровно за одно действие.
 *
 * Переключателя темы здесь нет: он доступен во всех трёх состояниях, ни от одного
 * из них не зависит и живёт отдельной плавающей кнопкой (`PaletteSwitcher`).
 */
export function Toolbar() {
  const { source, editing, setMode, fork, cancel, links, buildShareUrl } = useDoc()
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

  const hint =
    source === 'demo'
      ? 'Это пример сезона — форкните его и перепишите под свою семью'
      : editing
        ? 'Правьте текст прямо на постере'
        : 'Ваш сезон — ссылка хранит его целиком'

  return (
    <div className={styles.bar} role="toolbar" aria-label="Действия с листом">
      <span className={styles.hint}>{hint}</span>
      {/* Из примера выходят только форком: правка на месте молча потеряла бы слой
          заполнения. У своего сезона форкать нечего — там это и есть «Править». */}
      {source === 'demo' ? (
        // href появляется после кодирования; обычный клик работает и без него.
        <a className={styles.primary} href={links.fork || undefined} onClick={onNavClick(fork)}>
          Форкнуть пример
        </a>
      ) : (
        <button
          type="button"
          className={editing ? styles.primary : styles.ghost}
          onClick={() => setMode(editing ? 'view' : 'edit')}
        >
          {editing ? 'Готово' : 'Править'}
        </button>
      )}
      {/* Правящийся постер не распространяют: ссылка и печать — действия над готовым
          результатом, поэтому в правке их нет вовсе. Побочная выгода — из просмотра
          ссылка заведомо свежая: дебаунс записи адреса уже отработал. */}
      {!editing && (
        <>
          <button type="button" className={styles.ghost} onClick={() => void copyLink()}>
            {copied ? 'Скопировано ✓' : 'Скопировать ссылку'}
          </button>
          <button type="button" className={styles.ghost} onClick={() => print()}>
            Печать / PDF
          </button>
        </>
      )}
      {/* «Отмена» — шаг назад по истории: к примеру, если пришли форком, к лендингу,
          если начали новый сезон. Она нужна, только пока правку можно отыграть: после
          «Готово» сезон сам по себе. Это <button>, а не ссылка, — у шага назад нет
          собственного адреса, открывать его в новой вкладке нечем. */}
      {source === 'custom' && editing && (
        <button type="button" className={styles.ghost} onClick={cancel}>
          Отмена
        </button>
      )}
    </div>
  )
}
