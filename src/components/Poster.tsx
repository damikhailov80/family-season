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
import { useDoc } from '../state/docContext'

/**
 * Сам лист — то, что уходит на бумагу. Постер один на все состояния и на всех
 * провайдеров: живёт он в адресе, в `localStorage` или строкой в базе — рисуется
 * он одинаково, отсюда и отдельный компонент.
 *
 * Оформление читается уже внутри провайдера: тему CSS раздаёт атрибутом
 * (`PaperSheet`), а набор рисунков — контекстом, потому что геометрию SVG
 * атрибутом не подменишь.
 */
export function Poster() {
  const { palette, iconSet } = useDoc()

  return (
    <IconSetContext value={iconSet}>
      <PaperSheet palette={palette}>
        {/* Лист рассчитан на две страницы A4: по две нумерованные секции на каждой. */}
        <PrintPage>
          <Header />
          <MonthTheme />
          <WeeksSection />
          <MonthGoal />
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
