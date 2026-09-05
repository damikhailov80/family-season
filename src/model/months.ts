import ruSeptember from '../data/months/ru/september.json'
import enSeptember from '../data/months/en/september.json'
import plSeptember from '../data/months/pl/september.json'
import { exampleByKey, exampleKey, type Example } from './examples'
import { LANGS, type Lang } from './lang'

export interface MonthText {
  title: string
  description: string
  label: string
  heading: string
  lead: string[]
  seasonsHead: string
  seasonsText: string
  actionHead: string
  actionText: string
  action: string
  moreText: string
  more: string
}

// The slug is English in all three languages, so ROUTES stays a table of paths without the
// language and the hreflang set between the translations is trivial. The price is a Russian
// slug that would have read slightly better to Yandex, and it is accepted on purpose.
const TEXTS: Record<Lang, Record<string, MonthText>> = {
  ru: { september: ruSeptember },
  en: { september: enSeptember },
  pl: { september: plSeptember },
}

// Which of our examples belong to a month. It lives here rather than in the example files
// because a publication has no month of its own on purpose - an idea is taken as filling for
// somebody's month, and whose month it was is beside the point (see "The showcase: publishing").
// The month page is what groups them, so the grouping is the month page's business.
const SEASONS: Record<string, string[]> = {
  september: ['demo-4', 'demo-5', 'demo-6'],
}

export interface MonthPage {
  slug: string
  text: MonthText
  seasons: Example[]
}

export function monthPage(lang: Lang, slug: string): MonthPage | null {
  const text = TEXTS[lang][slug]
  if (!text) return null

  const seasons = (SEASONS[slug] ?? [])
    .map((id) => exampleByKey(exampleKey(lang, id)))
    .filter((example): example is Example => Boolean(example))

  return { slug, text, seasons }
}

export function monthSlugs(): string[] {
  return Object.keys(TEXTS.ru)
}

// The month pages are reachable from the showcase and from the landing page. Without a link
// they were an orphan: in the sitemap, but unreachable by walking the site - and a page nobody
// links to is a page a crawler treats as unimportant.
export function monthLinks(lang: Lang): { slug: string; label: string }[] {
  return monthSlugs().map((slug) => ({ slug, label: TEXTS[lang][slug].label }))
}

export function monthList(lang: Lang): { slug: string; label: string; heading: string }[] {
  return monthSlugs().map((slug) => ({
    slug,
    label: TEXTS[lang][slug].label,
    heading: TEXTS[lang][slug].heading,
  }))
}

export function monthPaths(): { lang: Lang; slug: string }[] {
  return LANGS.flatMap((lang) => monthSlugs().map((slug) => ({ lang, slug })))
}
