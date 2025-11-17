/**
 * Health Check Utilities
 * 
 * Provides health check functions for monitoring system status
 */

import { supabaseClient } from '../providers/supabaseClient'
import { typesenseClient, isTypesenseEnabled } from '../providers/typesenseClient'

export interface HealthStatus {
  healthy: boolean
  timestamp: string
  services: {
    database: ServiceHealth
    typesense: ServiceHealth
    supabase: ServiceHealth
  }
  version?: string
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  error?: string
  lastChecked: string
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  try {
    const { error } = await supabaseClient
      .from('tenants')
      .select('id')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - startTime
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is OK
      return {
        status: 'down',
        responseTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      }
    }
    
    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Check Typesense health
 */
async function checkTypesenseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  if (!isTypesenseEnabled() || !typesenseClient) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: 'Typesense is not configured',
      lastChecked: new Date().toISOString(),
    }
  }
  
  try {
    const health = await (typesenseClient as any).health.retrieve()
    const responseTime = Date.now() - startTime
    
    return {
      status: health.ok ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Check Supabase API health
 */
async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now()
  
  try {
    // Simple auth check
    await supabaseClient.auth.getSession()
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      responseTime,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
    }
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const [database, typesense, supabase] = await Promise.all([
    checkDatabaseHealth(),
    checkTypesenseHealth(),
    checkSupabaseHealth(),
  ])
  
  const allHealthy = 
    database.status === 'healthy' &&
    typesense.status === 'healthy' &&
    supabase.status === 'healthy'
  
  return {
    healthy: allHealthy,
    timestamp: new Date().toISOString(),
    services: {
      database,
      typesense,
      supabase,
    },
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  }
}

/**
 * Quick health check (database only)
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('tenants')
      .select('id')
      .limit(1)
    
    return !error || error.code === 'PGRST116'
  } catch {
    return false
  }
}

