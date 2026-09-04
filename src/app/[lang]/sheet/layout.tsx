import type { Metadata } from 'next'
import { getDict } from '../../../i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getDict()
  return { title: pages.sheetTitle, description: pages.sheetDescription }
}

export default function SheetLayout({ children }: { children: React.ReactNode }) {
  return children
}
