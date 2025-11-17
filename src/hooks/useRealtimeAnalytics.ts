import { useEffect, useCallback, useState } from 'react'
import { subscribeToAnalyticsUpdates } from '../services/analytics'

interface UseRealtimeAnalyticsOptions {
  enabled?: boolean
  refreshInterval?: number // in milliseconds
  tables?: Array<'search_logs' | 'documents' | 'tenants'>
}

/**
 * Hook to enable real-time updates for analytics data
 * Subscribes to database changes and triggers data refresh
 */
export function useRealtimeAnalytics(
  onUpdate: () => void,
  options: UseRealtimeAnalyticsOptions = {}
) {
  const {
    enabled = true,
    refreshInterval = 30000, // 30 seconds default
    tables = ['search_logs', 'documents', 'tenants']
  } = options

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(false)

  // Debounced update handler to prevent too many refreshes
  const handleUpdate = useCallback(() => {
    const now = new Date()
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime()

    // Only update if enough time has passed
    if (timeSinceLastUpdate >= refreshInterval) {
      setLastUpdate(now)
      onUpdate()
    }
  }, [lastUpdate, refreshInterval, onUpdate])

  useEffect(() => {
    if (!enabled) {
      setTimeout(() => {
        setIsLive(false)
      }, 0)
      return
    }

    setTimeout(() => {
      setIsLive(true)
    }, 0)
    const unsubscribeFunctions: Array<() => void> = []

    // Subscribe to each table
    tables.forEach(table => {
      const unsubscribe = subscribeToAnalyticsUpdates(table, handleUpdate)
      unsubscribeFunctions.push(unsubscribe)
    })

    // Cleanup subscriptions
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
      setIsLive(false)
    }
  }, [enabled, tables, handleUpdate])

  return {
    isLive,
    lastUpdate,
    refresh: onUpdate
  }
}
