import * as Sentry from "@sentry/react"

/**
 * User information for Sentry context
 */
export interface SentryUser {
  id: string
  email?: string
  username?: string
  tenantId?: string
  tenantName?: string
  role?: string
}

/**
 * Set user context in Sentry
 * This helps identify which users are experiencing errors
 *
 * @param user - User information to set in Sentry context
 * @example
 * ```ts
 * setSentryUser({
 *   id: '123',
 *   email: 'user@example.com',
 *   tenantId: 'tenant-456',
 *   role: 'admin'
 * })
 * ```
 */
export function setSentryUser(user: SentryUser | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    })

    // Set additional context
    Sentry.setContext("tenant", {
      id: user.tenantId,
      name: user.tenantName,
    })

    Sentry.setTag("user_role", user.role || "unknown")
  } else {
    // Clear user context on logout
    Sentry.setUser(null)
    Sentry.setContext("tenant", null)
  }
}

/**
 * Add a breadcrumb to track user actions
 * Breadcrumbs help understand the sequence of events leading to an error
 *
 * @param message - Description of the action
 * @param category - Category of the breadcrumb (e.g., 'ui', 'navigation', 'api')
 * @param level - Severity level
 * @param data - Additional data
 *
 * @example
 * ```ts
 * addBreadcrumb('User clicked save button', 'ui', 'info', { formId: 'user-form' })
 * ```
 */
export function addBreadcrumb(
  message: string,
  category: string = "custom",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Add a navigation breadcrumb
 *
 * @param from - Previous route
 * @param to - New route
 * @example
 * ```ts
 * addNavigationBreadcrumb('/dashboard', '/settings')
 * ```
 */
export function addNavigationBreadcrumb(from: string, to: string) {
  addBreadcrumb(`Navigated from ${from} to ${to}`, "navigation", "info", {
    from,
    to,
  })
}

/**
 * Add an API request breadcrumb
 *
 * @param method - HTTP method
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param data - Additional request data
 *
 * @example
 * ```ts
 * addApiRequestBreadcrumb('GET', '/api/users', 200, { query: 'search=john' })
 * ```
 */
export function addApiRequestBreadcrumb(
  method: string,
  url: string,
  statusCode?: number,
  data?: Record<string, unknown>
) {
  const level: Sentry.SeverityLevel =
    statusCode && statusCode >= 400 ? "error" : "info"

  addBreadcrumb(
    `${method} ${url} ${statusCode ? `[${statusCode}]` : ""}`,
    "api",
    level,
    {
      method,
      url,
      statusCode,
      ...data,
    }
  )
}

/**
 * Add a user interaction breadcrumb
 *
 * @param action - Type of interaction (e.g., 'click', 'submit', 'change')
 * @param target - Target element or component
 * @param data - Additional interaction data
 *
 * @example
 * ```ts
 * addUserInteractionBreadcrumb('click', 'DeleteButton', { itemId: '123' })
 * ```
 */
export function addUserInteractionBreadcrumb(
  action: string,
  target: string,
  data?: Record<string, unknown>
) {
  addBreadcrumb(`User ${action} on ${target}`, "ui", "info", {
    action,
    target,
    ...data,
  })
}

/**
 * Set custom tags for better error filtering and grouping
 *
 * @param tags - Key-value pairs of tags
 * @example
 * ```ts
 * setSentryTags({
 *   feature: 'user-management',
 *   version: '1.2.3'
 * })
 * ```
 */
export function setSentryTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value)
  })
}

/**
 * Set custom context for additional debugging information
 *
 * @param name - Context name
 * @param context - Context data
 * @example
 * ```ts
 * setSentryContext('api', {
 *   endpoint: '/api/users',
 *   method: 'POST',
 *   params: { limit: 10 }
 * })
 * ```
 */
export function setSentryContext(
  name: string,
  context: Record<string, unknown> | null
) {
  Sentry.setContext(name, context)
}

/**
 * Capture an exception manually
 *
 * @param error - Error to capture
 * @param context - Additional context
 * @example
 * ```ts
 * try {
 *   // some code
 * } catch (error) {
 *   captureException(error, { extra: { userId: '123' } })
 * }
 * ```
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    level?: Sentry.SeverityLevel
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    if (context?.level) {
      scope.setLevel(context.level)
    }

    Sentry.captureException(error)
  })
}

/**
 * Capture a message manually
 *
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 * @example
 * ```ts
 * captureMessage('User attempted unauthorized action', 'warning', {
 *   tags: { feature: 'auth' },
 *   extra: { userId: '123' }
 * })
 * ```
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value)
      })
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }

    Sentry.captureMessage(message, level)
  })
}

/**
 * Start a performance transaction
 *
 * @param name - Transaction name
 * @param op - Operation type
 * @returns Transaction object
 * @example
 * ```ts
 * const transaction = startTransaction('data-fetch', 'http.request')
 * // ... do work
 * transaction.finish()
 * ```
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}

/**
 * Start a performance span within a transaction
 *
 * @param transaction - Parent transaction
 * @param name - Span name
 * @param op - Operation type
 * @returns Span object
 * @example
 * ```ts
 * const transaction = startTransaction('page-load', 'navigation')
 * const span = startSpan(transaction, 'fetch-data', 'http.request')
 * // ... do work
 * span.finish()
 * transaction.finish()
 * ```
 */
export function startSpan(
  transaction: ReturnType<typeof startTransaction>,
  name: string,
  op: string
) {
  return transaction.startChild({
    op,
    description: name,
  })
}

/**
 * Show Sentry user feedback dialog
 * Allows users to provide feedback when they encounter an error
 *
 * @param eventId - Optional event ID to attach feedback to
 * @example
 * ```ts
 * showFeedbackDialog()
 * ```
 */
export function showFeedbackDialog(eventId?: string) {
  Sentry.showReportDialog({
    eventId: eventId || Sentry.lastEventId(),
    title: "It looks like we're having issues",
    subtitle: "Our team has been notified",
    subtitle2: "If you'd like to help, tell us what happened below.",
    labelName: "Name",
    labelEmail: "Email",
    labelComments: "What happened?",
    labelClose: "Close",
    labelSubmit: "Submit",
    errorGeneric:
      "An unknown error occurred while submitting your report. Please try again.",
    errorFormEntry: "Some fields were invalid. Please correct the errors and try again.",
    successMessage: "Your feedback has been sent. Thank you!",
  })
}

/**
 * Clear all Sentry context and breadcrumbs
 * Useful when a user logs out
 *
 * @example
 * ```ts
 * clearSentryContext()
 * ```
 */
export function clearSentryContext() {
  Sentry.setUser(null)
  Sentry.setContext("tenant", null)
  Sentry.setTags({})
}

export default {
  setSentryUser,
  addBreadcrumb,
  addNavigationBreadcrumb,
  addApiRequestBreadcrumb,
  addUserInteractionBreadcrumb,
  setSentryTags,
  setSentryContext,
  captureException,
  captureMessage,
  startTransaction,
  startSpan,
  showFeedbackDialog,
  clearSentryContext,
}
