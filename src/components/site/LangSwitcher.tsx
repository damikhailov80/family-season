import Link from 'next/link'
import { LANG_LABELS, LANGS, type Lang } from '../../model/lang'
import { withLang } from '../../model/site'
import styles from './LangSwitcher.module.css'

/**
 * Стоял в подвале и оказался ненаходимым: у невошедшего это единственный способ
 * сменить язык, а до подвала попавший не на свой язык просто не доходит.
 *
 * `<details>`, а не кнопка с меню: раскрытие умеет сам браузер, и клиентским
 * компонентом в обвязке сайта становиться не приходится.
 *
 * На кнопке один глобус, без названия языка, и на десктопе тоже: свободного места
 * в шапке около девяноста пикселей, а с «Русский» и `Polski` кнопка входа
 * сваливалась на вторую строку и ряд прыгал при смене языка.
 */
export function LangSwitcher({ lang, path, label }: { lang: Lang; path: string; label: string }) {
  return (
    <details className={styles.wrap}>
      <summary className={styles.current} aria-label={label} title={label}>
        <span aria-hidden="true" className={styles.globe}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
          </svg>
        </span>
      </summary>
      <ul className={styles.menu}>
        {LANGS.map((item) => (
          <li key={item}>
            <Link
              className={styles.lang}
              href={withLang(item, path)}
              hrefLang={item}
              aria-current={item === lang ? 'true' : undefined}
            >
              {LANG_LABELS[item]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
