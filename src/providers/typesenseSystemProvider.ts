import { typesenseClient } from './typesenseClient'

/**
 * System operations provider for Typesense
 * Handles health checks, metrics, stats, and administrative operations
 */

export const typesenseSystemProvider = {
  /**
   * Get system data (health, metrics, stats, debug)
   */
  getOne: async (id: string) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    try {
      // Health endpoint
      if (id === 'health') {
        const result = await (typesenseClient as any).health.retrieve()
        return { data: { id: 'health', ...result } }
      }

      // Metrics endpoint
      if (id === 'metrics') {
        const result = await (typesenseClient as any).metrics.json()
        return { data: { id: 'metrics', ...result } }
      }

      // Stats endpoint
      if (id === 'stats') {
        const result = await (typesenseClient as any).stats.json()
        return { data: { id: 'stats', ...result } }
      }

      // Debug endpoint
      if (id === 'debug') {
        const result = await (typesenseClient as any).debug.retrieve()
        return { data: { id: 'debug', ...result } }
      }

      throw new Error(`Unknown system endpoint: ${id}`)
    } catch (error) {
      console.error('Failed to fetch system data:', error)
      throw error
    }
  },

  /**
   * Perform system operations (snapshot, cache clear, DB compact, vote)
   */
  create: async (operation: string) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    try {
      // Create snapshot
      if (operation === 'snapshot') {
        const result = await (typesenseClient as any).operations.perform('snapshot', 'create')
        return {
          data: {
            id: 'snapshot',
            success: true,
            message: 'Snapshot created successfully',
            ...result
          }
        }
      }

      // Clear cache
      if (operation === 'cache/clear') {
        const result = await (typesenseClient as any).operations.perform('cache', 'clear')
        return {
          data: {
            id: 'cache',
            success: true,
            message: 'Cache cleared successfully',
            ...result
          }
        }
      }

      // Compact database
      if (operation === 'db/compact') {
        const result = await (typesenseClient as any).operations.perform('db', 'compact')
        return {
          data: {
            id: 'compact',
            success: true,
            message: 'Database compaction initiated',
            ...result
          }
        }
      }

      // Trigger leader re-election
      if (operation === 'vote') {
        const result = await (typesenseClient as any).operations.perform('vote')
        return {
          data: {
            id: 'vote',
            success: true,
            message: 'Leader re-election triggered',
            ...result
          }
        }
      }

      throw new Error(`Unknown operation: ${operation}`)
    } catch (error) {
      console.error('Failed to perform operation:', error)
      throw error
    }
  }
}
