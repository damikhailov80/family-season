import type { Metadata } from 'next'
import { DEFAULT_LANG, LANGS, type Lang } from './lang'
import { withLang } from './site'

const OG_LOCALE: Record<Lang, string> = { ru: 'ru_RU', en: 'en_US', pl: 'pl_PL' }

export const OG_IMAGE = { width: 1200, height: 630 }

export interface PageMeta {
  lang: Lang
  path: string
  title: string
  description: string
  siteName: string
  ogAlt: string
  index?: boolean
  alternates?: 'all' | 'self' | 'none'
}

// Next inherits the whole openGraph block from the layout and never fills og:title from the
// page title, so a page with its own text has to spell openGraph out in full. One assembler
// instead of twelve copies that would drift apart.
export function pageMeta({
  lang,
  path,
  title,
  description,
  siteName,
  ogAlt,
  index = true,
  alternates = 'all',
}: PageMeta): Metadata {
  const url = withLang(lang, path)
  const image = { url: `/og-${lang}.png`, alt: ogAlt, ...OG_IMAGE }
  const scope = index ? alternates : 'none'

  return {
    title,
    description,
    ...(scope === 'none' ? {} : { alternates: links(lang, path, scope) }),
    ...(index ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      type: 'website',
      locale: OG_LOCALE[lang],
      siteName,
      title,
      description,
      images: [image],
      ...(index ? { url } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

function links(lang: Lang, path: string, scope: 'all' | 'self') {
  const canonical = withLang(lang, path)
  if (scope === 'self') return { canonical, languages: { [lang]: canonical } }

  return {
    canonical,
    languages: {
      ...Object.fromEntries(LANGS.map((one) => [one, withLang(one, path)])),
      'x-default': withLang(DEFAULT_LANG, path),
    },
  }
}
