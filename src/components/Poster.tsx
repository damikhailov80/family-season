import { Header } from './Header'
import { MonthGoal } from './MonthGoal'
import { MonthTheme } from './MonthTheme'
import { MoodSection } from './MoodSection'
import { NextMonthIdeas } from './NextMonthIdeas'
import { PaperSheet } from './PaperSheet'
import { PrintPage } from './PrintPage'
import { ProjectsSection } from './ProjectsSection'
import { WeeksSection } from './WeeksSection'
import { IconSetContext } from './doodles/iconSetContext'
import type { QrMatrix } from '../model/qr'
import { useDoc } from '../state/docContext'

/**
 * Постер один на все три вида: где лежит содержимое, ему знать нечего.
 *
 * Тему CSS раздаёт атрибутом (`PaperSheet`), а набор рисунков — контекстом:
 * геометрию SVG атрибутом не подменишь. Пропом приходит только QR — код с личной
 * ссылкой знает страница, а не постер.
 */
export function Poster({ qr }: { qr?: QrMatrix }) {
  const { palette, iconSet } = useDoc()

  return (
    <IconSetContext value={iconSet}>
      <PaperSheet palette={palette}>
        <PrintPage>
          <Header />
          <MonthTheme />
          <WeeksSection />
          <MonthGoal qr={qr} />
        </PrintPage>
        <PrintPage>
          <ProjectsSection />
          <MoodSection />
          <NextMonthIdeas />
        </PrintPage>
      </PaperSheet>
    </IconSetContext>
  )
}
