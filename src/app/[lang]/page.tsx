import type { Metadata } from 'next'
import { Community } from '../components/landing/Community'
import { Examples } from '../components/landing/Examples'
import { Hero } from '../components/landing/Hero'
import { Inside } from '../components/landing/Inside'
import { Steps } from '../components/landing/Steps'
import { PaperSheet } from '../components/PaperSheet'

export const metadata: Metadata = {
  title: 'Семейный сезон — постер следующего месяца вашей семьи',
  description:
    'Что ждёт вас и близких в следующем месяце: соберите постер нового семейного сезона, распечатайте на двух листах A4 и повесьте на холодильник.',
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
