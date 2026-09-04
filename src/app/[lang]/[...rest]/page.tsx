import { notFound } from 'next/navigation'

/**
 * Маршрут нужен потому, что корневой лейаут лежит под `[lang]`: обычный
 * `app/not-found.tsx` рисовался бы без шапки, подвала и языка. Перехватить он
 * ничего не может — у catch-all самый низкий приоритет.
 */
export default function CatchAll() {
  notFound()
}
