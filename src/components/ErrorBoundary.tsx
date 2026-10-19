import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icons';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the failure for local debugging without shipping it anywhere.
    // eslint-disable-next-line no-console
    console.error('[Random Tech] Unexpected render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fatal-error container" role="alert">
        <div className="fatal-error__card">
          <span className="fatal-error__glyph" aria-hidden="true">
            <Icon name="alert" size={30} />
          </span>
          <p className="eyebrow">Something broke</p>
          <h1>The library hit an unexpected snag.</h1>
          <p>
            Your saved topics and notes are untouched. Reload to draw again, or head back to the
            home page.
          </p>
          <div className="fatal-error__actions">
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              <Icon name="rotate" size={16} /> Reload Random Tech
            </button>
            <a className="btn btn--clay" href="/">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
