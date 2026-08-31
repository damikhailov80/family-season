import Link from 'next/link'
import { LANG_LABELS, LANGS, type Lang } from '../../model/lang'
import { withLang } from '../../model/site'
import styles from './LangSwitcher.module.css'

/**
 * Переключатель языка в шапке.
 *
 * Стоял в подвале и оказался ненаходимым: у невошедшего это **единственный**
 * способ сменить язык, а лендинг длиной в два с половиной экрана, и попавший не
 * на свой язык до подвала не доходит. Место у такого переключателя одно — там,
 * куда смотрят, когда язык не тот.
 *
 * `<details>`, а не кнопка с меню: раскрытие умеет сам браузер, JS не нужен,
 * клиентским компонентом в обвязке сайта становиться не приходится. Три ссылки
 * внутри — обычные переходы на тот же путь, поэтому работает и без JS, а
 * запоминание берёт на себя `proxy` (см. «Языки» в CLAUDE.md).
 *
 * Подписи не переводятся: их читает тот, кто нужного языка ещё не видит, и
 * «польский» ему не поможет, а `Polski` — поможет.
 *
 * **На кнопке один глобус, без названия языка** — и на десктопе тоже. Свободного
 * места в шапке около девяноста пикселей (его собирает `margin-right: auto` у
 * бренда), а слово в неё не влезает: с «Русский» и `Polski` кнопка входа
 * сваливалась на вторую строку, и ряд ещё и прыгал при смене языка — у трёх
 * названий три разные ширины. Значок же одинаков всегда.
 *
 * Какой язык сейчас, видно по самой странице, а для читалки язык назван в
 * `aria-label` кнопки. Полные имена стоят в самом меню — там они и нужны.
 */
export function LangSwitcher({ lang, path, label }: { lang: Lang; path: string; label: string }) {
  return (
    <details className={styles.wrap}>
      <summary className={styles.current} aria-label={label} title={label}>
        <span aria-hidden="true" className={styles.globe}>
          {/* Глобус — inline SVG: растровых картинок в проекте нет. */}
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
