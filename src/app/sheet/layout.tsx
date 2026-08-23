import type { Metadata } from 'next'

/*
 * Лейаут заведён только ради metadata: сама страница листа — 'use client'
 * (внутри `dynamic` с `ssr: false`), а из клиентского модуля metadata не экспортируется.
 */
export const metadata: Metadata = {
  title: 'Постер сезона — Семейный сезон',
  description: 'Соберите сезон под свою семью и распечатайте на двух листах A4.',
}

export default function SheetLayout({ children }: { children: React.ReactNode }) {
  return children
}
