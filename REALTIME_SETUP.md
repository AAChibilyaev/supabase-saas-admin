# Real-time Subscriptions Setup Guide

This guide explains how to configure Supabase Realtime for live data updates in the SaaS Admin application.

## Overview

The application uses Supabase Realtime to subscribe to PostgreSQL changes and automatically refresh data in the UI without manual intervention. This provides:

- Live embedding status updates in DocumentList
- Real-time search analytics in SearchLogList
- Live dashboard statistics
- API key usage count updates
- Team member presence indicators

## Implementation Details

### Core Hook: `useRealtimeSubscription`

Located at: `src/hooks/useRealtimeSubscription.ts`

**Key Features:**
- Subscribes to PostgreSQL changes via Supabase Realtime
- Supports optional filtering by column/value (e.g., tenant_id)
- Integrates with React Admin's `useRefresh()` for automatic cache updates
- Handles subscription lifecycle with proper cleanup
- Shows toast notifications for INSERT, UPDATE, DELETE events

**Usage Examples:**

```tsx
// Basic subscription
useRealtimeSubscription({
  resource: 'documents',
  showNotifications: true,
})

// With tenant filtering
useRealtimeSubscription({
  resource: 'documents',
  filter: { column: 'tenant_id', value: 'abc-123' },
  showNotifications: true,
})

// With custom event handler
useRealtimeSubscription({
  resource: 'search_logs',
  onEvent: (payload) => {
    console.log('Event received:', payload)
  },
})
```

### Components Using Real-time Updates

1. **DocumentList** (`src/resources/documents/DocumentList.tsx`)
   - Subscribes to `documents` table
   - Shows live embedding status updates
   - Displays real-time file uploads and changes

2. **SearchLogList** (`src/resources/search-logs/SearchLogList.tsx`)
   - Subscribes to `search_logs` table
   - Live search analytics and query tracking
   - Real-time performance metrics

3. **Dashboard** (`src/Dashboard.tsx`)
   - Uses `useRealtimeAnalytics` hook
   - Subscribes to multiple tables: `search_logs`, `documents`, `tenants`
   - Live statistics and quota tracking
   - Displays "Live Updates" badge when active

4. **ApiKeyList** (`src/resources/api-keys/ApiKeyList.tsx`)
   - Subscribes to `tenant_api_keys` table
   - Real-time usage count updates
   - Live status changes (active/revoked/expired)

5. **TeamMemberList** (`src/resources/team-members/TeamMemberList.tsx`)
   - Subscribes to `user_tenants` table
   - Filtered by current tenant
   - Live team member updates and role changes

## Supabase Dashboard Configuration

### Step 1: Enable Replication for Tables

You must enable replication for each table you want to subscribe to:

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Enable replication for these tables:
   - `documents`
   - `search_logs`
   - `tenant_usage`
   - `tenant_api_keys`
   - `user_tenants`
   - `daily_usage_stats`
   - `tenants`

**Alternative: Using SQL**

```sql
-- Enable replication for all required tables
ALTER TABLE documents REPLICA IDENTITY FULL;
ALTER TABLE search_logs REPLICA IDENTITY FULL;
ALTER TABLE tenant_usage REPLICA IDENTITY FULL;
ALTER TABLE tenant_api_keys REPLICA IDENTITY FULL;
ALTER TABLE user_tenants REPLICA IDENTITY FULL;
ALTER TABLE daily_usage_stats REPLICA IDENTITY FULL;
ALTER TABLE tenants REPLICA IDENTITY FULL;
```

### Step 2: Configure Realtime Settings

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Under **Realtime**, ensure it is enabled
3. Note: Realtime is enabled by default in Supabase projects

### Step 3: Set Row Level Security (RLS) Policies

Ensure RLS policies allow users to subscribe to changes:

```sql
-- Example: Allow authenticated users to read documents
CREATE POLICY "Users can read documents"
ON documents FOR SELECT
TO authenticated
USING (true);

-- Example: Allow users to read search logs for their tenant
CREATE POLICY "Users can read own tenant search logs"
ON search_logs FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants
    WHERE user_id = auth.uid()
  )
);
```

### Step 4: Verify Realtime Connection

Check the browser console for:
- Successful WebSocket connections
- Subscription confirmations
- Event payloads when data changes

## Testing Real-time Subscriptions

### Test 1: Document Updates
1. Navigate to the Documents page
2. Open another tab/window with the same page
3. Create or update a document in one tab
4. Verify the other tab shows the update automatically

### Test 2: Search Logs
1. Navigate to the Search Logs page
2. Perform a search via your API
3. Verify the new log appears without refresh

### Test 3: Dashboard Statistics
1. Open the Dashboard
2. Verify the "Live Updates" badge is visible
3. Make changes to data (create documents, run searches)
4. Watch statistics update in real-time

### Test 4: Tenant Filtering
1. Navigate to Team Members page
2. Switch tenants using tenant selector
3. Verify subscriptions update with correct filters
4. Add/remove team members in another session
5. Confirm changes appear in filtered view

## Troubleshooting

### Issue: No real-time updates appearing

**Solutions:**
1. Check that replication is enabled for the table
2. Verify RLS policies allow SELECT on the table
3. Check browser console for WebSocket errors
4. Ensure Supabase project is not paused
5. Verify environment variables are correct:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Issue: Too many notifications

**Solution:** Set `showNotifications: false` in the hook options:

```tsx
useRealtimeSubscription({
  resource: 'search_logs',
  showNotifications: false, // Disable toast notifications
})
```

### Issue: Memory leaks or duplicate subscriptions

**Solution:** The hook automatically cleans up on unmount. Ensure you're not creating subscriptions outside of React components or hooks.

### Issue: Filtered subscriptions not working

**Solution:** Verify the filter syntax:

```tsx
// Correct
filter: { column: 'tenant_id', value: 'abc-123' }

// Incorrect - value must be string or number
filter: { column: 'tenant_id', value: null }
```

## Performance Considerations

### Rate Limiting
- Supabase Realtime has connection limits based on your plan
- Free tier: 200 concurrent connections
- Pro tier: 500 concurrent connections

### Best Practices
1. Use filters to reduce subscription scope
2. Disable notifications for high-frequency updates
3. Consider debouncing refresh calls for rapid changes
4. Monitor connection count in Supabase Dashboard

### Debouncing Example

The `useRealtimeAnalytics` hook includes built-in debouncing:

```tsx
const { isLive } = useRealtimeAnalytics(
  () => {
    // Refresh data
  },
  {
    enabled: true,
    refreshInterval: 30000, // Only refresh every 30 seconds max
  }
)
```

## Security Notes

1. **Authentication Required:** All subscriptions require authenticated users
2. **RLS Enforcement:** Row Level Security policies are enforced on subscriptions
3. **Tenant Isolation:** Use filters to ensure users only see their tenant's data
4. **API Key Protection:** Never expose service role keys to the client

## Advanced: Custom Event Handlers

You can add custom logic when events occur:

```tsx
useRealtimeSubscription({
  resource: 'documents',
  onEvent: (payload) => {
    if (payload.eventType === 'INSERT') {
      // Custom logic for new documents
      console.log('New document:', payload.new)

      // Could trigger analytics, notifications, etc.
    }
  },
  showNotifications: false, // Disable default notifications
})
```

## Monitoring

### Check Active Subscriptions

Use the browser console:

```javascript
// List all active Supabase channels
console.log(supabaseClient.getChannels())
```

### Database Queries

Monitor active Realtime connections in PostgreSQL:

```sql
-- View active replication slots
SELECT * FROM pg_replication_slots;

-- View active subscriptions (if using logical replication)
SELECT * FROM pg_stat_subscription;
```

## Related Files

- `/src/hooks/useRealtimeSubscription.ts` - Core subscription hook
- `/src/hooks/useRealtimeAnalytics.ts` - Analytics-specific hook
- `/src/services/analytics.ts` - Analytics service with subscription helpers
- `/src/providers/supabaseClient.ts` - Supabase client configuration

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Postgres Changes Documentation](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
