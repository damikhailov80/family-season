import { Header } from './components/Header'
import { MonthGoal } from './components/MonthGoal'
import { MonthSummary } from './components/MonthSummary'
import { MonthTheme } from './components/MonthTheme'
import { MoodSection } from './components/MoodSection'
import { PaperSheet } from './components/PaperSheet'
import { ProjectsSection } from './components/ProjectsSection'
import { WeeksSection } from './components/WeeksSection'

export default function App() {
  return (
    <PaperSheet>
      <Header />
      <MonthTheme />
      <WeeksSection />
      <MonthGoal />
      <ProjectsSection />
      <MoodSection />
      <MonthSummary />
    </PaperSheet>
  )
}
