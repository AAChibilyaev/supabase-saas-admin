import { typesenseClient, isTypesenseEnabled, withRetry } from '../providers/typesenseClient'
import type { ConfigurationOptions } from 'typesense/lib/Typesense/Configuration'

export interface TypesenseHealthStatus {
  isHealthy: boolean
  nodes: NodeHealthStatus[]
  timestamp: number
  error?: string
}

export interface NodeHealthStatus {
  url: string
  isHealthy: boolean
  responseTimeMs?: number
  error?: string
}

export interface TypesenseClusterStats {
  collections: number
  memory_used_bytes?: number
  uptime_seconds?: number
  version?: string
}

/**
 * Check the health of a single Typesense node
 */
const checkNodeHealth = async (
  node: ConfigurationOptions['nodes'][0] & { protocol: string; host: string; port: number }
): Promise<NodeHealthStatus> => {
  const url = `${node.protocol}://${node.host}:${node.port}`
  const startTime = Date.now()

  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: {
        'X-TYPESENSE-API-KEY': import.meta.env.VITE_TYPESENSE_API_KEY || '',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const responseTimeMs = Date.now() - startTime

    if (response.ok) {
      return {
        url,
        isHealthy: true,
        responseTimeMs,
      }
    } else {
      return {
        url,
        isHealthy: false,
        responseTimeMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }
  } catch (error) {
    return {
      url,
      isHealthy: false,
      responseTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check the health of all Typesense nodes
 */
export const checkTypesenseHealth = async (): Promise<TypesenseHealthStatus> => {
  const timestamp = Date.now()

  // Check if Typesense is enabled
  if (!isTypesenseEnabled() || !typesenseClient) {
    return {
      isHealthy: false,
      nodes: [],
      timestamp,
      error: 'Typesense is not configured or client initialization failed',
    }
  }

  try {
    // Get node configuration from the client
    const config = typesenseClient.configuration

    // Check health of all nodes in parallel
    const nodeHealthChecks = await Promise.all(
      config.nodes.map((node: ConfigurationOptions['nodes'][0]) =>
        checkNodeHealth(node as ConfigurationOptions['nodes'][0] & { protocol: string; host: string; port: number })
      )
    )

    // Cluster is healthy if at least one node is healthy
    const isHealthy = nodeHealthChecks.some((node) => node.isHealthy)

    return {
      isHealthy,
      nodes: nodeHealthChecks,
      timestamp,
      error: isHealthy ? undefined : 'All nodes are unhealthy',
    }
  } catch (error) {
    return {
      isHealthy: false,
      nodes: [],
      timestamp,
      error: error instanceof Error ? error.message : 'Health check failed',
    }
  }
}

/**
 * Get cluster statistics from Typesense
 */
export const getTypesenseClusterStats = async (): Promise<TypesenseClusterStats | null> => {
  if (!isTypesenseEnabled() || !typesenseClient) {
    console.warn('Typesense is not enabled')
    return null
  }

  try {
    // Use retry mechanism for getting stats
    const stats = await withRetry(
      async () => {
        // Get collections count
        const collections = await typesenseClient!.collections().retrieve()

        // Get debug/stats endpoint (may not be available in all deployments)
        let debugStats: Record<string, unknown> | null = null
        try {
          debugStats = await typesenseClient!.operations.perform('get', '/debug') as Record<string, unknown>
        } catch (error) {
          console.debug('Debug endpoint not available:', error)
        }

        return {
          collections: collections.length,
          memory_used_bytes: debugStats?.memory_used_bytes as number | undefined,
          uptime_seconds: debugStats?.uptime_seconds as number | undefined,
          version: debugStats?.version as string | undefined,
        }
      },
      {
        maxRetries: 2,
        initialDelayMs: 500,
      }
    )

    return stats
  } catch (error) {
    console.error('Failed to get cluster stats:', error)
    return null
  }
}

/**
 * Perform a test search to verify Typesense functionality
 */
export const performHealthCheckSearch = async (
  collectionName: string
): Promise<boolean> => {
  if (!isTypesenseEnabled() || !typesenseClient) {
    return false
  }

  try {
    await withRetry(
      async () => {
        // Perform a simple search with minimal results
        await typesenseClient!
          .collections(collectionName)
          .documents()
          .search({
            q: '*',
            query_by: 'id', // Assuming all collections have an id field
            per_page: 1,
          })
      },
      {
        maxRetries: 2,
        initialDelayMs: 500,
      }
    )
    return true
  } catch (error) {
    console.error(`Health check search failed for collection ${collectionName}:`, error)
    return false
  }
}

/**
 * Monitor Typesense health continuously
 */
export class TypesenseHealthMonitor {
  private intervalId: NodeJS.Timeout | null = null
  private healthCheckIntervalMs: number
  private onHealthChange?: (status: TypesenseHealthStatus) => void
  private lastHealthStatus: boolean | null = null

  constructor(
    healthCheckIntervalMs: number = 60000, // Default: 1 minute
    onHealthChange?: (status: TypesenseHealthStatus) => void
  ) {
    this.healthCheckIntervalMs = healthCheckIntervalMs
    this.onHealthChange = onHealthChange
  }

  /**
   * Start monitoring health
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Health monitor is already running')
      return
    }

    // Perform initial health check immediately
    this.performCheck()

    // Schedule periodic health checks
    this.intervalId = setInterval(() => {
      this.performCheck()
    }, this.healthCheckIntervalMs)

    console.info(
      `Typesense health monitor started (interval: ${this.healthCheckIntervalMs}ms)`
    )
  }

  /**
   * Stop monitoring health
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.info('Typesense health monitor stopped')
    }
  }

  /**
   * Perform a health check
   */
  private async performCheck(): Promise<void> {
    try {
      const status = await checkTypesenseHealth()

      // Notify on health status change
      if (
        this.onHealthChange &&
        this.lastHealthStatus !== null &&
        this.lastHealthStatus !== status.isHealthy
      ) {
        this.onHealthChange(status)
      }

      this.lastHealthStatus = status.isHealthy

      // Log health status
      if (status.isHealthy) {
        const healthyNodes = status.nodes.filter((n) => n.isHealthy)
        console.debug(
          `Typesense health check passed: ${healthyNodes.length}/${status.nodes.length} nodes healthy`
        )
      } else {
        console.warn('Typesense health check failed:', status.error)
      }
    } catch (error) {
      console.error('Health check error:', error)
    }
  }

  /**
   * Check if monitoring is active
   */
  isRunning(): boolean {
    return this.intervalId !== null
  }
}

/**
 * Create and start a health monitor (convenience function)
 */
export const createHealthMonitor = (
  intervalMs?: number,
  onHealthChange?: (status: TypesenseHealthStatus) => void
): TypesenseHealthMonitor => {
  const monitor = new TypesenseHealthMonitor(intervalMs, onHealthChange)
  monitor.start()
  return monitor
}

/**
 * Wait for Typesense to become healthy (useful for startup checks)
 */
export const waitForHealthy = async (
  timeoutMs: number = 30000,
  checkIntervalMs: number = 2000
): Promise<boolean> => {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const health = await checkTypesenseHealth()
    if (health.isHealthy) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, checkIntervalMs))
  }

  return false
}
