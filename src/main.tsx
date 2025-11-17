import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider'
import { ErrorBoundary } from './components/error'
import * as Sentry from "@sentry/react"

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.feedbackIntegration({
      colorScheme: "system",
      autoInject: false,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE
    ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE)
    : 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Session Replay
  replaysSessionSampleRate: import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE
    ? parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE)
    : 0.1,
  replaysOnErrorSampleRate: import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
    ? parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE)
    : 1.0,

  // Environment configuration
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  release: import.meta.env.VITE_SENTRY_RELEASE,

  // Enable debug mode in development
  debug: import.meta.env.DEV,

  // Before send hook to filter sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!import.meta.env.VITE_SENTRY_DSN) {
      return null
    }

    // Filter out sensitive headers and data
    if (event.request?.headers) {
      delete event.request.headers['Authorization']
      delete event.request.headers['Cookie']
    }

    return event
  },

  // Ignore specific errors
  ignoreErrors: [
    // Random plugins/extensions
    'top.GLOBALS',
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
    // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
    // reduce this. (thanks @acdha)
    // See http://stackoverflow.com/questions/4113268
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
    'conduitPage',
  ],

  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary showDialog={false}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
