import { Header } from './components/Header'
import { MonthGoal } from './components/MonthGoal'
import { MonthTheme } from './components/MonthTheme'
import { MoodSection } from './components/MoodSection'
import { NextMonthIdeas } from './components/NextMonthIdeas'
import { PaperSheet } from './components/PaperSheet'
import { PrintPage } from './components/PrintPage'
import { ProjectsSection } from './components/ProjectsSection'
import { WeeksSection } from './components/WeeksSection'
import { Toolbar } from './components/edit/Toolbar'
import type { Boot } from './state/DocProvider'
import { DocProvider } from './state/DocProvider'

export default function App({ boot }: { boot: Boot }) {
  return (
    <DocProvider boot={boot}>
      <Toolbar />
      <PaperSheet>
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
    </DocProvider>
  )
}
