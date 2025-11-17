import { ReactNode } from 'react'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

interface RealtimeListProps {
  resource: string
  children: ReactNode
  showNotifications?: boolean
}

/**
 * Wrapper component that enables real-time updates for List views
 *
 * @example
 * ```tsx
 * export const TenantList = () => (
 *   <RealtimeList resource="tenants">
 *     <List>
 *       <Datagrid>
 *         ...
 *       </Datagrid>
 *     </List>
 *   </RealtimeList>
 * )
 * ```
 */
export const RealtimeList = ({
  resource,
  children,
  showNotifications = true,
}: RealtimeListProps) => {
  useRealtimeSubscription({
    resource,
    enabled: true,
    showNotifications,
  })

  return <>{children}</>
}
