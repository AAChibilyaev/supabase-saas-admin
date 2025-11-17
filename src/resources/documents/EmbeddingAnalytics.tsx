import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { supabaseClient } from '../../providers/compositeDataProvider'
import { EMBEDDING_MODELS } from '../../services/openai'

interface EmbeddingStats {
  total_embeddings: number
  successful_embeddings: number
  failed_embeddings: number
  avg_processing_time_ms: number
  avg_token_count: number
  first_embedding_at: string | null
  last_embedding_at: string | null
}

interface RecentEmbedding {
  id: string
  document_id: string
  embedding_model: string
  embedding_dimensions: number
  token_count: number
  processing_time_ms: number
  success: boolean
  error_message: string | null
  created_at: string
}

export const EmbeddingAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EmbeddingStats | null>(null)
  const [recentEmbeddings, setRecentEmbeddings] = useState<RecentEmbedding[]>([])
  const [modelBreakdown, setModelBreakdown] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    setRefreshing(true)
    try {
      // Fetch embedding statistics
      const { data: statsData, error: statsError } = await supabaseClient
        .from('embedding_statistics')
        .select('*')
        .single()

      if (!statsError && statsData) {
        setStats(statsData)
      }

      // Fetch recent embeddings
      const { data: recentData, error: recentError } = await supabaseClient
        .from('embedding_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!recentError && recentData) {
        setRecentEmbeddings(recentData)

        // Calculate model breakdown
        const breakdown = recentData.reduce((acc, item) => {
          const model = item.embedding_model || 'unknown'
          acc[model] = (acc[model] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        setModelBreakdown(breakdown)
      }
    } catch (error) {
      console.error('Failed to fetch embedding analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const calculateTotalCost = () => {
    if (!recentEmbeddings.length) return 0
    return recentEmbeddings.reduce((total, embedding) => {
      const model = embedding.embedding_model
      const modelInfo = EMBEDDING_MODELS[model as keyof typeof EMBEDDING_MODELS]
      if (!modelInfo) return total
      const cost = (embedding.token_count / 1_000_000) * modelInfo.costPer1M
      return total + cost
    }, 0)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const successRate = stats
    ? ((stats.successful_embeddings / stats.total_embeddings) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Embedding Analytics</h2>
          <p className="text-gray-500">Monitor your OpenAI embedding generation</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Embeddings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_embeddings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.successful_embeddings || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.failed_embeddings || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.avg_processing_time_ms || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per embedding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculateTotalCost().toFixed(6)}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 20 embeddings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Embeddings</TabsTrigger>
          <TabsTrigger value="models">Model Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Embedding Generations</CardTitle>
              <CardDescription>Last 20 embedding operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEmbeddings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No embeddings generated yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentEmbeddings.map((embedding) => (
                      <div key={embedding.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {embedding.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {embedding.embedding_model}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(embedding.created_at)}
                              {embedding.error_message && (
                                <span className="ml-2 text-red-600">
                                  - {embedding.error_message}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline">
                            <Zap className="w-3 h-3 mr-1" />
                            {embedding.embedding_dimensions}D
                          </Badge>
                          <span className="text-gray-500">
                            {embedding.token_count.toLocaleString()} tokens
                          </span>
                          <span className="text-gray-500">
                            {formatDuration(embedding.processing_time_ms)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Usage Distribution</CardTitle>
              <CardDescription>Breakdown by embedding model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(modelBreakdown).map(([model, count]) => {
                  const modelInfo = EMBEDDING_MODELS[model as keyof typeof EMBEDDING_MODELS]
                  const percentage = (count / recentEmbeddings.length) * 100

                  return (
                    <div key={model} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{modelInfo?.name || model}</span>
                        <span className="text-gray-500">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {modelInfo && (
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                          <span>{modelInfo.dimensions} dimensions</span>
                          <span>${modelInfo.costPer1M}/1M tokens</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {Object.keys(modelBreakdown).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No model data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
