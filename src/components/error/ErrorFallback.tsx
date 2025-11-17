import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import * as Sentry from "@sentry/react"

interface ErrorFallbackProps {
  error: Error | null
  resetError?: () => void
}

/**
 * Error Fallback UI Component
 *
 * Displays a user-friendly error message when an error boundary catches an error.
 * Provides options to retry or navigate home.
 *
 * @param error - The error that was caught
 * @param resetError - Function to reset the error state and retry
 */
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV

  const handleReportFeedback = () => {
    const eventId = Sentry.lastEventId()
    if (eventId) {
      Sentry.showReportDialog({ eventId })
    }
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We're sorry, but something unexpected happened. Our team has been notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <p className="font-semibold text-destructive mb-2">Error Details (Development Only):</p>
              <p className="text-muted-foreground break-all">{error.message}</p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48 text-muted-foreground">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You can try refreshing the page or returning to the home page.
            </p>
            <p className="text-sm text-muted-foreground">
              If the problem persists, please report it to our team.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {resetError && (
            <Button
              onClick={resetError}
              variant="default"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          <Button
            onClick={handleReportFeedback}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Report Issue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
