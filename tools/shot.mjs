import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export function shoot(html, { width, height, out }) {
  const work = mkdtempSync(join(tmpdir(), 'shot-'))
  writeFileSync(join(work, 'page.html'), html)

  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=ffffff',
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      join(work, 'page.html'),
    ],
    { stdio: 'ignore' },
  )
}
