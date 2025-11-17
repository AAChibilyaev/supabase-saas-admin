/**
 * Sentry Integration Examples
 *
 * This file contains practical examples of how to use Sentry
 * in different scenarios throughout the application.
 */

import {
  setSentryUser,
  addBreadcrumb,
  addApiRequestBreadcrumb,
  addUserInteractionBreadcrumb,
  captureException,
  captureMessage,
  setSentryTags,
  setSentryContext,
  startTransaction,
  showFeedbackDialog,
} from './index'

/**
 * Example 1: Setting User Context on Login
 */
export function exampleSetUserOnLogin() {
  // After successful login
  const user = {
    id: '123',
    email: 'user@example.com',
    username: 'john_doe',
    tenantId: 'tenant-456',
    tenantName: 'Acme Corp',
    role: 'admin',
  }

  setSentryUser(user)

  // Set additional tags for this session
  setSentryTags({
    tenant: user.tenantName,
    role: user.role,
  })
}

/**
 * Example 2: Clearing User Context on Logout
 */
export function exampleClearUserOnLogout() {
  // Before logout
  setSentryUser(null)
}

/**
 * Example 3: Tracking Form Submission
 */
export async function exampleFormSubmission() {
  addUserInteractionBreadcrumb('click', 'SubmitButton', {
    formName: 'user-profile-form',
  })

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'John' }),
    })

    addApiRequestBreadcrumb('POST', '/api/users', response.status)

    if (!response.ok) {
      throw new Error('Failed to save user')
    }

    addBreadcrumb('User profile saved successfully', 'action', 'info')
  } catch (error) {
    captureException(error as Error, {
      tags: { feature: 'user-profile' },
      extra: { formData: { name: 'John' } },
      level: 'error',
    })

    // Show feedback dialog to let user report the issue
    showFeedbackDialog()
  }
}

/**
 * Example 4: Tracking Navigation
 */
export function exampleNavigation(fromPath: string, toPath: string) {
  addBreadcrumb(`Navigated from ${fromPath} to ${toPath}`, 'navigation', 'info', {
    from: fromPath,
    to: toPath,
  })
}

/**
 * Example 5: Tracking Search Operations
 */
export async function exampleSearchOperation(query: string) {
  const transaction = startTransaction('search-operation', 'task')
  if (!transaction) {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    return response.json()
  }

  try {
    // Track search query
    addBreadcrumb('User performed search', 'search', 'info', { query })

    // Perform search
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

    addApiRequestBreadcrumb('GET', '/api/search', response.status, { query })

    const results = await response.json()

    // Track results
    addBreadcrumb('Search completed', 'search', 'info', {
      query,
      resultCount: results.length,
    })

    return results
  } catch (error) {
    captureException(error as Error, {
      tags: { feature: 'search' },
      extra: { query },
      level: 'error',
    })
    throw error
  } finally {
    transaction.finish()
  }
}

/**
 * Example 6: Tracking API Errors
 */
export async function exampleApiErrorHandling() {
  try {
    const response = await fetch('/api/data')

    if (!response.ok) {
      // Log API error with context
      captureMessage(`API Error: ${response.status} ${response.statusText}`, 'error', {
        tags: {
          api_endpoint: '/api/data',
          status_code: response.status.toString(),
        },
        extra: {
          headers: Object.fromEntries(response.headers.entries()),
        },
      })
    }

    return await response.json()
  } catch (error) {
    captureException(error as Error, {
      tags: { feature: 'data-fetch' },
      level: 'error',
    })
    throw error
  }
}

/**
 * Example 7: Performance Monitoring
 */
export async function examplePerformanceMonitoring() {
  const transaction = startTransaction('data-processing', 'task')
  if (!transaction) {
    const users = await fetch('/api/users').then(r => r.json())
    return users.map((user: any) => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
    }))
  }

  try {
    // Track data fetch
    const fetchSpan = transaction.startChild({
      op: 'http.request',
      description: 'Fetch user data',
    })

    const users = await fetch('/api/users').then(r => r.json())
    fetchSpan.finish()

    // Track data processing
    const processSpan = transaction.startChild({
      op: 'task',
      description: 'Process user data',
    })

    const processed = users.map((user: any) => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
    }))

    processSpan.finish()

    return processed
  } finally {
    transaction.finish()
  }
}

/**
 * Example 8: Handling Async Errors
 */
export async function exampleAsyncErrorHandling() {
  try {
    const promises = [
      fetch('/api/users'),
      fetch('/api/posts'),
      fetch('/api/comments'),
    ]

    const results = await Promise.all(promises)

    results.forEach((response, index) => {
      const endpoints = ['/api/users', '/api/posts', '/api/comments']
      addApiRequestBreadcrumb('GET', endpoints[index], response.status)
    })

    return results
  } catch (error) {
    captureException(error as Error, {
      tags: { feature: 'parallel-fetch' },
      extra: { endpoints: ['users', 'posts', 'comments'] },
      level: 'error',
    })
    throw error
  }
}

/**
 * Example 9: Tracking User Permissions Issues
 */
export function examplePermissionDenied(resource: string, action: string) {
  captureMessage('Permission denied', 'warning', {
    tags: {
      feature: 'permissions',
      resource,
      action,
    },
    extra: {
      timestamp: new Date().toISOString(),
    },
  })

  addBreadcrumb('Permission denied', 'auth', 'warning', {
    resource,
    action,
  })
}

/**
 * Example 10: Setting Context for API Calls
 */
export async function exampleApiCallWithContext(endpoint: string) {
  // Set context before making API call
  setSentryContext('api_call', {
    endpoint,
    timestamp: new Date().toISOString(),
    method: 'GET',
  })

  try {
    const response = await fetch(endpoint)
    return await response.json()
  } catch (error) {
    captureException(error as Error)
    throw error
  } finally {
    // Clear context after call
    setSentryContext('api_call', null)
  }
}

/**
 * Example 11: React Component Integration
 *
 * ```tsx
 * import { ErrorBoundary } from '@/components/error'
 * import { addUserInteractionBreadcrumb } from '@/lib/sentry'
 *
 * function UserProfile() {
 *   const handleSave = () => {
 *     addUserInteractionBreadcrumb('click', 'SaveProfileButton')
 *
 *     try {
 *       saveProfile()
 *     } catch (error) {
 *       captureException(error)
 *     }
 *   }
 *
 *   return (
 *     <ErrorBoundary>
 *       <form onSubmit={handleSave}>
 *         ...
 *       </form>
 *     </ErrorBoundary>
 *   )
 * }
 * ```
 */

/**
 * Example 12: Using Sentry Hooks
 *
 * ```tsx
 * import { useSentryUser } from '@/hooks/useSentry'
 *
 * function App() {
 *   const user = useAuth() // Your auth hook
 *
 *   // Automatically track user in Sentry
 *   useSentryUser(user ? {
 *     id: user.id,
 *     email: user.email,
 *     tenantId: user.tenantId,
 *     role: user.role
 *   } : null)
 *
 *   return <div>...</div>
 * }
 * ```
 */
