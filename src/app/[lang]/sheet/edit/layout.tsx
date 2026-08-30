import type { Metadata } from 'next'
import { getDict } from '../../../../i18n/server'

/* Как и у /sheet, лейаут заведён только ради metadata: страница — 'use client'. */
export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getDict()
  return { title: pages.sheetEditTitle, description: pages.sheetEditDescription }
}

export default function SheetEditLayout({ children }: { children: React.ReactNode }) {
  return children
}
