import { Component } from 'react';
import { translate } from '../shared/i18n/messages.js';

// Last line of defence: an unexpected render error shows a message and a
// reload button instead of unmounting the whole app (a blank page)
export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Unexpected error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const locale = document.documentElement.lang === 'en' ? 'en' : 'sl';
    return (
      <main className="login">
        <section className="card login__card" role="alert">
          <h1>{translate(locale, 'error.title')}</h1>
          <p className="muted">{translate(locale, 'error.text')}</p>
          <button type="button" className="button button--primary button--block" onClick={() => window.location.assign('/')}>
            {translate(locale, 'error.reload')}
          </button>
        </section>
      </main>
    );
  }
}
