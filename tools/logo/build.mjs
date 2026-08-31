/*
 * Знак сайта: фавиконка `public/favicon.svg` и её растровая копия
 * `public/logo-120.png` для экрана согласия Google (Cloud Console → Branding
 * принимает только PNG/JPG ровно 120×120).
 *
 * Знак — продукт в одной картинке: лист A4 на плашке и сердце на листе.
 *
 * Оба файла собираются, руками их не правят. Причина та же, что у доодлов сайта:
 * сердце уже лежит в библиотеке постера, и держать его геометрию во второй копии
 * нельзя — разойдётся. Поэтому источник здесь — сам `ICONS['heart']`, а скрипт лишь
 * кладёт его на бумагу; в отличие от постера рисунок здесь залит, а не обведён:
 * во вкладке в 16 px тонкий контур истончается до трети пикселя и пропадает.
 *
 * PNG рисует тот же headless Chrome, которым проверяется печать: тащить в
 * зависимости отдельный конвертер ради одной картинки незачем.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ICONS, ICON_VIEWBOX } from '../../src/components/doodles/icons.generated.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** Плашка и чернила — краски темы постера по умолчанию «Янтарь и лазурь» (--c3 и --c2).
    У сайта своей палитры нет, а знак обязан быть цветным сам по себе. */
const TILE = '#336B87'
const PAPER = '#fff'
const INK = '#763626'
/** Скругление плашки — как у иконок приложений, примерно четверть стороны. */
const RADIUS = 15
/** Лист бумаги в долях сетки 64; пропорция близка к A4 (34:46 против 1:1.41).
    Он и делает знак постером, а не просто сердцем. */
const SHEET = { x: 15, y: 9, w: 34, h: 46, r: 4 }
/** Поле от края листа: меньше — и рисунок липнет к краю бумаги. */
const PADDING = 3.5
/** Габарит `heart` внутри сетки 64×64 — снят через getBBox, у контура он заметно
    уже, чем управляющие точки. Поменяется рисунок — перемерить. */
const BOX = { x: 4, y: 8.04, w: 56, h: 49.96 }
const SIZE = 120

const shape = ICONS['heart']
const scale = (SHEET.w - 2 * PADDING) / BOX.w
const round = (n) => Number(n.toFixed(3))
// Центрируем габарит рисунка на листе: в самой библиотеке он сидит не по центру сетки.
const tx = round(SHEET.x + SHEET.w / 2 - (BOX.x + BOX.w / 2) * scale)
const ty = round(SHEET.y + SHEET.h / 2 - (BOX.y + BOX.h / 2) * scale)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}" width="${ICON_VIEWBOX}" height="${ICON_VIEWBOX}" role="img" aria-label="Семейный сезон">
  <!-- Собран tools/logo/build.mjs (npm run logo) из ICONS['heart']. Руками не править. -->
  <rect width="${ICON_VIEWBOX}" height="${ICON_VIEWBOX}" rx="${RADIUS}" fill="${TILE}"/>
  <rect x="${SHEET.x}" y="${SHEET.y}" width="${SHEET.w}" height="${SHEET.h}" rx="${SHEET.r}" fill="${PAPER}"/>
  <g transform="translate(${tx} ${ty}) scale(${round(scale)})" fill="${INK}">
${(shape.paths ?? []).map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
</svg>
`

writeFileSync(join(root, 'public', 'favicon.svg'), svg)

const work = mkdtempSync(join(tmpdir(), 'logo-'))
// Фон белый, а не прозрачный: у знака свои скруглённые углы, и на тёмной подложке
// прозрачные уголки выглядели бы обгрызенными. Google показывает плашку на белом.
writeFileSync(
  join(work, 'page.html'),
  `<style>html,body{margin:0;background:#fff}svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${svg}`,
)

const png = join(root, 'public', `logo-${SIZE}.png`)
execFileSync(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=ffffff',
    `--window-size=${SIZE},${SIZE}`,
    `--screenshot=${png}`,
    join(work, 'page.html'),
  ],
  { stdio: 'ignore' },
)

console.log(`logo: public/favicon.svg, public/logo-${SIZE}.png (${SIZE}×${SIZE})`)
