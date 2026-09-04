import type { Metadata } from 'next'
import { getDict, getLang } from '../../i18n/server'
import { pageMeta } from '../../model/meta'
import { ROUTES } from '../../model/site'
import { Community } from '../../components/landing/Community'
import { Examples } from '../../components/landing/Examples'
import { Hero } from '../../components/landing/Hero'
import { Inside } from '../../components/landing/Inside'
import { Steps } from '../../components/landing/Steps'
import { PaperSheet } from '../../components/PaperSheet'
import { AppSchema } from '../../components/site/StructuredData'

export async function generateMetadata(): Promise<Metadata> {
  const { landing, site } = await getDict()
  return pageMeta({
    lang: await getLang(),
    path: ROUTES.home,
    title: landing.title,
    description: landing.description,
    siteName: site.brand,
    ogAlt: site.ogAlt,
  })
}

export default function Page() {
  return (
    <PaperSheet>
      <Hero />
      <Steps />
      <Inside />
      <Examples />
      <Community />
      <AppSchema />
    </PaperSheet>
  )
}
