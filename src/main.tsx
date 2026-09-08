import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// dev-only: keep the full text of every console.error so a crash can be read back from the browser
if (import.meta.env.DEV) {
  const errs: string[] = ((window as unknown as { __errs: string[] }).__errs = [])
  const orig = console.error
  console.error = (...args: unknown[]) => {
    errs.push(args.map((a) => (a instanceof Error ? `${a.message}
${a.stack}` : String(a))).join(' | '))
    orig(...args)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
