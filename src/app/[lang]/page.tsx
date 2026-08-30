import type { Metadata } from 'next'
import { getDict } from '../../i18n/server'
import { Community } from '../../components/landing/Community'
import { Examples } from '../../components/landing/Examples'
import { Hero } from '../../components/landing/Hero'
import { Inside } from '../../components/landing/Inside'
import { Steps } from '../../components/landing/Steps'
import { PaperSheet } from '../../components/PaperSheet'

export async function generateMetadata(): Promise<Metadata> {
  const { landing } = await getDict()
  return { title: landing.title, description: landing.description }
}

export default function Page() {
  return (
    <PaperSheet>
      <Hero />
      <Steps />
      <Inside />
      <Examples />
      <Community />
    </PaperSheet>
  )
}
