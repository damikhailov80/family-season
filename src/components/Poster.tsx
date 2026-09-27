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

// On a publication the page is headed by the bar, which names the idea; the poster's own title
// is usually the placeholder, and fifty pages headed by the brand read as duplicates.
export function Poster({ qr, titleAs }: { qr?: QrMatrix; titleAs?: 'h1' | 'p' }) {
  const { palette, iconSet } = useDoc()

  return (
    <IconSetContext value={iconSet}>
      <PaperSheet palette={palette}>
        <PrintPage>
          <Header titleAs={titleAs} />
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
