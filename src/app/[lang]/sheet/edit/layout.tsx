import type { Metadata } from 'next'
import { getDict } from '../../../../i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getDict()
  return { title: pages.sheetEditTitle, description: pages.sheetEditDescription }
}

export default function SheetEditLayout({ children }: { children: React.ReactNode }) {
  return children
}
