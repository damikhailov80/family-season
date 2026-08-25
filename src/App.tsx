import { Header } from './components/Header'
import { MonthGoal } from './components/MonthGoal'
import { MonthTheme } from './components/MonthTheme'
import { MoodSection } from './components/MoodSection'
import { NextMonthIdeas } from './components/NextMonthIdeas'
import { PaperSheet } from './components/PaperSheet'
import { IconSetContext } from './components/doodles/iconSetContext'
import { PrintPage } from './components/PrintPage'
import { ProjectsSection } from './components/ProjectsSection'
import { WeeksSection } from './components/WeeksSection'
import { FloatingControls } from './components/edit/FloatingControls'
import { Toolbar } from './components/edit/Toolbar'
import { useDoc } from './state/docContext'
import type { Boot } from './state/DocProvider'
import { DocProvider } from './state/DocProvider'

/**
 * Оформление живёт на постере, а не на странице, поэтому читать его нужно уже
 * внутри провайдера. Тему раздаёт CSS через атрибут, набор рисунков — контекст:
 * геометрию SVG атрибутом не подменишь.
 */
function ThemedPaper({ children }: { children: React.ReactNode }) {
  const { palette, iconSet } = useDoc()
  return (
    <IconSetContext value={iconSet}>
      <PaperSheet palette={palette}>{children}</PaperSheet>
    </IconSetContext>
  )
}

export default function App({ boot }: { boot: Boot }) {
  return (
    <DocProvider boot={boot}>
      <Toolbar />
      {/* Тема и рисунки не зависят от состояния постера — они есть и у примера,
          и в правке, поэтому стоят не в тулбаре, а сами по себе: плавающие кнопки
          держатся в углу окна, пока постер листают. В разметке — сразу за
          тулбаром, чтобы с клавиатуры до них доходили раньше самого листа. */}
      <FloatingControls />
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
