import type { Metadata } from 'next'
import { getDict } from '../../../i18n/server'

/*
 * Лейаут заведён только ради metadata: сама страница листа — 'use client'
 * (внутри `dynamic` с `ssr: false`), а из клиентского модуля metadata не экспортируется.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getDict()
  return { title: pages.sheetTitle, description: pages.sheetDescription }
}

export default function SheetLayout({ children }: { children: React.ReactNode }) {
  return children
}
