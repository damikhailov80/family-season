import { Header } from './components/Header'
import { MonthGoal } from './components/MonthGoal'
import { MonthTheme } from './components/MonthTheme'
import { MoodSection } from './components/MoodSection'
import { NextMonthIdeas } from './components/NextMonthIdeas'
import { PaperSheet } from './components/PaperSheet'
import { PrintPage } from './components/PrintPage'
import { ProjectsSection } from './components/ProjectsSection'
import { WeeksSection } from './components/WeeksSection'
import { PaletteSwitcher } from './components/edit/PaletteSwitcher'
import { Toolbar } from './components/edit/Toolbar'
import { useDoc } from './state/docContext'
import type { Boot } from './state/DocProvider'
import { DocProvider } from './state/DocProvider'

/** Тема живёт на постере, поэтому читать её нужно уже внутри провайдера. */
function ThemedPaper({ children }: { children: React.ReactNode }) {
  const { palette } = useDoc()
  return <PaperSheet palette={palette}>{children}</PaperSheet>
}

export default function App({ boot }: { boot: Boot }) {
  return (
    <DocProvider boot={boot}>
      <Toolbar />
      {/* Тема не зависит от состояния постера — она есть и у примера, и в правке,
          поэтому стоит не в тулбаре, а сама по себе: плавающая кнопка держится
          в углу окна, пока постер листают. В разметке — сразу за тулбаром, чтобы
          с клавиатуры до неё доходили раньше самого листа. */}
      <PaletteSwitcher />
      <ThemedPaper>
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
      </ThemedPaper>
    </DocProvider>
  )
}
