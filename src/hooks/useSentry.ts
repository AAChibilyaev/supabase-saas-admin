import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  setSentryUser,
  addNavigationBreadcrumb,
  clearSentryContext,
  type SentryUser,
} from '@/lib/sentry'

/**
 * Hook to automatically track user context in Sentry
 *
 * @param user - Current user information
 * @example
 * ```tsx
 * function App() {
 *   const user = useCurrentUser()
 *   useSentryUser(user)
 *   return <div>...</div>
 * }
 * ```
 */
export function useSentryUser(user: SentryUser | null) {
  useEffect(() => {
    if (user) {
      setSentryUser(user)
    } else {
      clearSentryContext()
    }

    // Clear context on unmount
    return () => {
      clearSentryContext()
    }
  }, [user])
}

/**
 * Hook to automatically track navigation in Sentry
 *
 * Adds breadcrumbs for route changes to help debug navigation-related issues
 *
 * @example
 * ```tsx
 * function App() {
 *   useSentryNavigation()
 *   return <Router>...</Router>
 * }
 * ```
 */
export function useSentryNavigation() {
  const location = useLocation()

  useEffect(() => {
    // Track navigation changes
    addNavigationBreadcrumb(document.referrer || 'direct', location.pathname)
  }, [location])
}

/**
 * Combined hook for common Sentry functionality
 *
 * @param user - Current user information
 * @example
 * ```tsx
 * function App() {
 *   const user = useCurrentUser()
 *   useSentry(user)
 *   return <div>...</div>
 * }
 * ```
 */
export function useSentry(user: SentryUser | null) {
  useSentryUser(user)
  useSentryNavigation()
}
