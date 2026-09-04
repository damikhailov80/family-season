import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// What a messenger will draw, without a deploy. The card is assembled from the tags the page
// really serves, and the picture is taken from the address being checked - so a local run
// shows the local og-*.png even though the tag itself names the production address.
const target = process.argv[2] ?? 'http://localhost:3000/ru'

const TAGS = [
  'og:site_name',
  'og:title',
  'og:description',
  'og:image',
  'og:url',
  'twitter:card',
] as const

const response = await fetch(target, {
  headers: { 'user-agent': 'TelegramBot (like TwitterBot)' },
})
if (!response.ok) {
  console.error(`${target} answered ${response.status}`)
  process.exit(1)
}

const html = await response.text()
const headEnd = html.indexOf('</head>')

function tag(name: string): { value: string; late: boolean } | null {
  const attribute = name.startsWith('og:') ? 'property' : 'name'
  const found = html.match(new RegExp(`<meta ${attribute}="${name}" content="([^"]*)"`))
  if (!found) return null
  return { value: found[1], late: headEnd >= 0 && found.index > headEnd }
}

const found = new Map(TAGS.map((name) => [name, tag(name)]))

for (const name of TAGS) {
  const hit = found.get(name)
  if (!hit) console.log(`— ${name}: missing`)
  else
    console.log(
      `${hit.late ? '!' : '·'} ${name}: ${hit.value}${hit.late ? '  (after </head>)' : ''}`,
    )
}
if ([...found.values()].some((hit) => hit?.late)) {
  console.log('\n! a tag after </head> is streamed metadata: a crawler may never read it')
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const value = (name: (typeof TAGS)[number]) => escape(found.get(name)?.value ?? '')
const image = found.get('og:image')?.value
const shown = image ? new URL(new URL(image).pathname, target).href : null

const card = `<meta charset="utf-8">
<title>Link preview — ${escape(target)}</title>
<style>
  body { margin: 0; padding: 40px; background: #d5e8c8; font: 15px/1.4 -apple-system, system-ui, sans-serif }
  .msg { max-width: 560px; margin: 0 auto; background: #eeffdd; border-radius: 14px; padding: 14px 16px }
  .link { color: #2b7fd4; word-break: break-all; margin-bottom: 10px }
  .card { border-left: 3px solid #6cb04b; padding-left: 12px }
  .site { color: #4a9c2d; font-weight: 700 }
  .title { font-weight: 700; margin-top: 2px }
  .text { margin-top: 2px }
  .shot { margin-top: 10px; width: 100%; border-radius: 8px; display: block }
  .none { margin-top: 10px; padding: 20px; text-align: center; color: #a00; border: 2px dashed #a00; border-radius: 8px }
  .meta { max-width: 560px; margin: 24px auto 0; font-size: 13px; color: #3a4a2f }
  .meta code { background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px }
</style>
<div class="msg">
  <div class="link">${escape(target)}</div>
  <div class="card">
    <div class="site">${value('og:site_name')}</div>
    <div class="title">${value('og:title')}</div>
    <div class="text">${value('og:description')}</div>
    ${shown ? `<img class="shot" src="${escape(shown)}" alt="">` : '<div class="none">no og:image</div>'}
  </div>
</div>
<div class="meta">
  Assembled from the tags <code>${escape(target)}</code> really serves.
  ${shown && image !== shown ? `The picture is loaded from <code>${escape(shown)}</code> — the tag names <code>${escape(image)}</code>.` : ''}
</div>
`

const out = join(tmpdir(), 'og-preview.html')
writeFileSync(out, card)
console.log(`\ncard: ${out}`)
execFileSync('open', [out])
