import { useEffect, useRef } from 'react'
import { useNotify, useRefresh } from 'react-admin'
import { supabaseClient } from '../providers/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

type SupabaseRealtimePayload = {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, any>
  old: Record<string, any>
  errors: string[] | null
}

interface UseRealtimeSubscriptionOptions {
  resource: string
  enabled?: boolean
  showNotifications?: boolean
  onEvent?: (payload: SupabaseRealtimePayload) => void
}

/**
 * Hook to subscribe to real-time updates for a Supabase table
 *
 * @param options - Configuration options
 * @param options.resource - The resource/table name to subscribe to
 * @param options.enabled - Whether to enable the subscription (default: true)
 * @param options.showNotifications - Whether to show toast notifications (default: true)
 * @param options.onEvent - Optional callback for handling events
 *
 * @example
 * ```tsx
 * useRealtimeSubscription({
 *   resource: 'tenants',
 *   showNotifications: true,
 * })
 * ```
 */
export const useRealtimeSubscription = ({
  resource,
  enabled = true,
  showNotifications = true,
  onEvent,
}: UseRealtimeSubscriptionOptions) => {
  const notify = useNotify()
  const refresh = useRefresh()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Create a channel for the resource
    const channel = supabaseClient
      .channel(`realtime:${resource}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: resource,
        },
        (payload) => {
          const typedPayload = payload as unknown as SupabaseRealtimePayload

          // Call custom event handler if provided
          if (onEvent) {
            onEvent(typedPayload)
          }

          // Show notifications
          if (showNotifications) {
            const resourceName = resource.replace(/_/g, ' ')
            switch (typedPayload.eventType) {
              case 'INSERT':
                notify(`New ${resourceName} created`, { type: 'info' })
                break
              case 'UPDATE':
                notify(`${resourceName} updated`, { type: 'info' })
                break
              case 'DELETE':
                notify(`${resourceName} deleted`, { type: 'warning' })
                break
            }
          }

          // Refresh the view to show updated data
          refresh()
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [resource, enabled, showNotifications, notify, refresh, onEvent])

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current)
        channelRef.current = null
      }
    },
  }
}
