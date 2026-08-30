import Link from 'next/link'
import { LANG_LABELS, LANGS, type Lang } from '../../model/lang'
import { withLang } from '../../model/site'
import styles from './LangSwitcher.module.css'

/**
 * Переключатель языка в подвале — три обычные ссылки на тот же путь.
 *
 * Ссылки, а не кнопка с действием: язык живёт в адресе, и «переключить» — это
 * буквально «перейти». Работает без JS, а запоминание берёт на себя `proxy`:
 * увидев язык в пути, он перепишет куку (см. `src/proxy.ts`).
 *
 * Настройку вошедшего это не трогает — она меняется только в кабинете. Так и
 * задумано: адрес говорит, на чём показать сейчас, настройка — на чём открывать
 * сайт впредь.
 *
 * Подписи не переводятся: их читает тот, кто нужного языка ещё не видит, и
 * «польский» ему не поможет, а `Polski` — поможет.
 */
export function LangSwitcher({ lang, path, label }: { lang: Lang; path: string; label: string }) {
  return (
    <nav className={styles.langs} aria-label={label}>
      {LANGS.map((item) => (
        <Link
          key={item}
          className={styles.lang}
          href={withLang(item, path)}
          hrefLang={item}
          // Текущий язык остаётся ссылкой: убрать её значило бы сдвинуть
          // соседние на его место, и глаз перестал бы попадать по привычному.
          aria-current={item === lang ? 'true' : undefined}
        >
          {LANG_LABELS[item]}
        </Link>
      ))}
    </nav>
  )
}
