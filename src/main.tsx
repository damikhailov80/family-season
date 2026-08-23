import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/print.css'
import App from './App.tsx'
import { decodeTemplate, readHashPayload } from './model/codec.ts'
import { loadDraft } from './model/storage.ts'
import { createDemoTemplate } from './model/templates.ts'
import type { Boot } from './state/DocProvider.tsx'

/**
 * Лист берём из ссылки ещё до первого рендера: иначе на долю секунды
 * мелькнёт демо-пример и только потом подменится на присланный лист.
 */
async function bootstrap(): Promise<Boot> {
  const hasDraft = loadDraft() !== null
  const payload = readHashPayload()
  if (payload) {
    const template = await decodeTemplate(payload)
    if (template) return { template, source: 'custom', hasDraft }
  }
  return { template: createDemoTemplate(), source: 'demo', hasDraft }
}

void bootstrap().then((boot) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App boot={boot} />
    </StrictMode>,
  )
})
