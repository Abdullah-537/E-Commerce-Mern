import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#fff3f3', margin: 20, borderRadius: 8, border: '2px solid #ff4444' }}>
          <h2 style={{ color: '#cc0000' }}>Something went wrong</h2>
          <pre style={{ color: '#cc0000', whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ marginTop: 10 }}>
            <summary>Stack trace</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>
              {this.state.error?.stack}
            </pre>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#999' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            style={{ marginTop: 16, padding: '8px 20px', background: '#3874ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }) }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
