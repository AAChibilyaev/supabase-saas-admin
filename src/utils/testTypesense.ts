/**
 * Test utility for Typesense connection and health checks
 * Run this in the browser console to verify Typesense setup
 */

import {
  checkTypesenseHealth,
  getTypesenseClusterStats,
  createHealthMonitor,
  waitForHealthy,
} from './typesenseHealth'
import {
  checkTypesenseAvailability,
  getTypesenseResources,
} from '../providers/compositeDataProvider'
import { isTypesenseEnabled } from '../providers/typesenseClient'

export interface TestResult {
  test: string
  passed: boolean
  message: string
  data?: unknown
}

/**
 * Run all Typesense tests
 */
export const runTypesenseTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = []

  console.group('Typesense Connection Tests')

  // Test 1: Check if Typesense is enabled
  console.log('Test 1: Checking if Typesense is enabled...')
  const enabled = isTypesenseEnabled()
  results.push({
    test: 'Typesense Enabled',
    passed: enabled,
    message: enabled
      ? 'Typesense client is initialized'
      : 'Typesense client is not initialized (check environment variables)',
  })

  if (!enabled) {
    console.groupEnd()
    return results
  }

  // Test 2: Check health of all nodes
  console.log('Test 2: Checking health of all nodes...')
  try {
    const health = await checkTypesenseHealth()
    results.push({
      test: 'Node Health Check',
      passed: health.isHealthy,
      message: health.isHealthy
        ? `${health.nodes.filter((n) => n.isHealthy).length}/${health.nodes.length} nodes are healthy`
        : health.error || 'Health check failed',
      data: health,
    })
  } catch (error) {
    results.push({
      test: 'Node Health Check',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 3: Get cluster statistics
  console.log('Test 3: Getting cluster statistics...')
  try {
    const stats = await getTypesenseClusterStats()
    results.push({
      test: 'Cluster Statistics',
      passed: stats !== null,
      message: stats
        ? `Found ${stats.collections} collections`
        : 'Failed to get cluster stats',
      data: stats,
    })
  } catch (error) {
    results.push({
      test: 'Cluster Statistics',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 4: Check Typesense availability and collections
  console.log('Test 4: Checking Typesense availability...')
  try {
    const availability = await checkTypesenseAvailability()
    results.push({
      test: 'Typesense Availability',
      passed: availability.available,
      message: availability.available
        ? `Available. Collections: ${availability.collections.join(', ')}`
        : availability.error || 'Not available',
      data: availability,
    })
  } catch (error) {
    results.push({
      test: 'Typesense Availability',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 5: Check registered resources
  console.log('Test 5: Checking registered Typesense resources...')
  const resources = getTypesenseResources()
  results.push({
    test: 'Registered Resources',
    passed: resources.length > 0,
    message:
      resources.length > 0
        ? `${resources.length} resources registered: ${resources.join(', ')}`
        : 'No resources registered for Typesense search',
    data: resources,
  })

  // Test 6: Wait for healthy (with short timeout for testing)
  console.log('Test 6: Testing wait for healthy...')
  try {
    const isHealthy = await waitForHealthy(5000, 1000)
    results.push({
      test: 'Wait for Healthy',
      passed: isHealthy,
      message: isHealthy
        ? 'Cluster became healthy within timeout'
        : 'Cluster did not become healthy within timeout',
    })
  } catch (error) {
    results.push({
      test: 'Wait for Healthy',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  console.groupEnd()

  // Print summary
  console.group('Test Summary')
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  console.log(`Passed: ${passed}/${total}`)
  console.table(
    results.map((r) => ({
      Test: r.test,
      Status: r.passed ? '✓ PASS' : '✗ FAIL',
      Message: r.message,
    }))
  )
  console.groupEnd()

  return results
}

/**
 * Test health monitoring
 */
export const testHealthMonitor = (durationMs: number = 10000): void => {
  console.log(`Starting health monitor for ${durationMs}ms...`)

  const monitor = createHealthMonitor(2000, (status) => {
    console.log('Health status changed:', status)
  })

  setTimeout(() => {
    monitor.stop()
    console.log('Health monitor stopped')
  }, durationMs)
}

/**
 * Print Typesense configuration
 */
export const printTypesenseConfig = (): void => {
  console.group('Typesense Configuration')
  console.table({
    Host: import.meta.env.VITE_TYPESENSE_HOST,
    Port: import.meta.env.VITE_TYPESENSE_PORT,
    Protocol: import.meta.env.VITE_TYPESENSE_PROTOCOL,
    'API Key': import.meta.env.VITE_TYPESENSE_API_KEY
      ? '****' + import.meta.env.VITE_TYPESENSE_API_KEY.slice(-4)
      : 'Not set',
    'Connection Timeout': import.meta.env.VITE_TYPESENSE_CONNECTION_TIMEOUT || '5',
    'Retry Interval': import.meta.env.VITE_TYPESENSE_RETRY_INTERVAL || '1',
    'Num Retries': import.meta.env.VITE_TYPESENSE_NUM_RETRIES || '3',
    'Healthcheck Interval':
      import.meta.env.VITE_TYPESENSE_HEALTHCHECK_INTERVAL || '60',
    'Cache Seconds': import.meta.env.VITE_TYPESENSE_CACHE_SECONDS || '0',
    'Log Level': import.meta.env.VITE_TYPESENSE_LOG_LEVEL || 'info',
  })
  console.groupEnd()
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  ;(window as any).typesenseTests = {
    runTests: runTypesenseTests,
    testHealthMonitor,
    printConfig: printTypesenseConfig,
  }
  console.info(
    'Typesense test utilities loaded. Use window.typesenseTests to access them.'
  )
}
