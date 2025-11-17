import * as Sentry from "@sentry/react"
import { Component, ReactNode } from "react"
import { ErrorFallback } from "./ErrorFallback"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDialog?: boolean
  beforeCapture?: (scope: Sentry.Scope, error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component with Sentry Integration
 *
 * Catches React component errors and reports them to Sentry.
 * Displays a user-friendly error fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.withScope((scope) => {
      scope.setContext("errorInfo", {
        componentStack: errorInfo.componentStack,
      })

      // Allow custom scope modifications before capture
      if (this.props.beforeCapture) {
        this.props.beforeCapture(scope, error, errorInfo)
      }

      Sentry.captureException(error)
    })

    // Show user feedback dialog if enabled
    if (this.props.showDialog) {
      Sentry.showReportDialog({
        eventId: Sentry.lastEventId(),
      })
    }

    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

/**
 * HOC version of ErrorBoundary using Sentry's built-in error boundary
 * This provides additional Sentry-specific features
 */
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: ({ error, resetError }) => (
    <ErrorFallback error={error} resetError={resetError} />
  ),
  showDialog: false,
})

export default ErrorBoundary
