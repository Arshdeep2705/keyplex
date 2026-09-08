import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** changes to this value reset the boundary — pass the pathname so navigating away recovers */
  resetKey?: string
}
interface State {
  error: Error | null
}

/** A stale code-split chunk after a deploy is the one crash that a plain reload always fixes. */
function isStaleChunk(err: Error) {
  return /dynamically imported module|Importing a module script failed|Loading chunk|Loading CSS chunk/i.test(
    err.message,
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
    if (isStaleChunk(error) && !sessionStorage.getItem('abh_chunk_reload')) {
      sessionStorage.setItem('abh_chunk_reload', '1')
      window.location.reload()
    }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-paper px-5">
        <div className="max-w-md text-center">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="display-tight mt-3 font-display text-[32px] font-semibold text-ink">
            That page hit a snag
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            It's on our side, not yours. Reloading usually sorts it — or call us on 1300 539 759.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-pine px-6 py-3 text-[14.5px] font-semibold text-paper transition-all hover:shadow-lift"
            >
              Reload page
            </button>
            <a
              href="/packages"
              className="rounded-lg border border-line bg-card px-6 py-3 text-[14.5px] font-semibold text-ink transition-colors hover:border-brass"
            >
              Browse packages
            </a>
          </div>
        </div>
      </section>
    )
  }
}
