import type { Metadata } from 'next'
import { getDict, getLang } from '../../../i18n/server'
import { pageMeta } from '../../../model/meta'
import { ROUTES } from '../../../model/site'

export async function generateMetadata(): Promise<Metadata> {
  const { pages, site } = await getDict()
  return pageMeta({
    lang: await getLang(),
    path: ROUTES.sheet,
    title: pages.sheetTitle,
    description: pages.sheetDescription,
    siteName: site.brand,
    ogAlt: site.ogAlt,
    index: false,
  })
}

export default function SheetLayout({ children }: { children: React.ReactNode }) {
  return children
}
