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
