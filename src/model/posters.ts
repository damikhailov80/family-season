import { EXAMPLE_LIST, examplesFor, type Example } from './examples'
import type { Lang } from './lang'
import { shortCode } from './shortcode'

// A sheet of a poster as it prints: the A4 content width in CSS pixels (190 mm), the height of
// the frame, the white margin around it and the scale it is shot at. A stretched page is 1039 px;
// the frame is a little taller because the fill layer written into an example grows a sheet by
// up to ~26 px (a long wrap-up in English), and the picture must not cut it.
// `npm run posters` shoots with these numbers and the markup states them as the picture's size,
// so the two cannot drift apart.
export const POSTER_PAGE = { width: 718, height: 1072 }
export const POSTER_MARGIN = 24
export const POSTER_SCALE = 1.5
export const POSTER_IMAGE = {
  width: (POSTER_PAGE.width + 2 * POSTER_MARGIN) * POSTER_SCALE,
  height: (POSTER_PAGE.height + 2 * POSTER_MARGIN) * POSTER_SCALE,
}

// Only our examples have them - a picture per printed sheet, made ahead of time by
// `npm run posters` from a running build; a person's publication changes too often and lives in
// the database only.
const EXAMPLE_CODES = new Set(EXAMPLE_LIST.map((example) => shortCode('public', example.publicId)))

export function posterPages(code: string): [string, string] | null {
  return EXAMPLE_CODES.has(code) ? [`/posters/${code}-1.jpg`, `/posters/${code}-2.jpg`] : null
}

// One of our examples in this language, a different one on every visit. Read from the registry,
// not the database: the landing page must stand when the database is down.
export function randomPoster(lang: Lang): { example: Example; pages: [string, string] } | null {
  const shown = examplesFor(lang).flatMap((example) => {
    const pages = posterPages(shortCode('public', example.publicId))
    return pages ? [{ example, pages }] : []
  })
  return shown.length > 0 ? shown[Math.floor(Math.random() * shown.length)] : null
}
