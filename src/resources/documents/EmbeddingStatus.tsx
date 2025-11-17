import { useState } from 'react'
import { useNotify, useRefresh, useRecordContext } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Clock,
  Zap,
} from 'lucide-react'
import { supabaseClient } from '../../providers/supabaseClient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { EMBEDDING_MODELS, type EmbeddingModel } from '../../services/openai'

export const EmbeddingStatus = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [generating, setGenerating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  if (!record) return null

  const handleGenerateEmbedding = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabaseClient.functions.invoke('generate-embedding', {
        body: {
          documentId: record.id,
          forceRegenerate: record.embedding_generated,
        },
      })

      if (error) throw error

      if (data?.success) {
        notify(
          `Embedding generated successfully! Tokens: ${data.tokens}, Cost: $${data.cost.toFixed(6)}`,
          { type: 'success' }
        )
        refresh()
      } else if (data?.skipped) {
        notify('Embedding already exists', { type: 'info' })
      }
    } catch (error: unknown) {
      console.error('Failed to generate embedding:', error)
      notify(error instanceof Error ? error.message : 'Failed to generate embedding', { type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (record.embedding_generated) {
    const model = record.embedding_model || 'unknown'
    const modelInfo = EMBEDDING_MODELS[model as EmbeddingModel]

    return (
      <div className="flex items-center gap-2">
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Generated
              </Badge>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Embedding Details</DialogTitle>
              <DialogDescription>
                Vector embedding information for this document
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Model</div>
                  <div className="text-sm font-mono">
                    {modelInfo?.name || model}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Dimensions</div>
                  <div className="text-sm font-mono">{record.embedding_dimensions || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Generated At</div>
                  <div className="text-sm">
                    {record.embedding_updated_at
                      ? formatDate(record.embedding_updated_at)
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Hash</div>
                  <div className="text-xs font-mono truncate" title={record.embedding_hash}>
                    {record.embedding_hash?.substring(0, 16) || 'N/A'}...
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDetails(false)
                    handleGenerateEmbedding()
                  }}
                  disabled={generating}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  Regenerate Embedding
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <XCircle className="w-4 h-4 text-gray-400" />
      <Button
        onClick={handleGenerateEmbedding}
        disabled={generating || !record.content}
        size="sm"
        variant="outline"
      >
        {generating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </>
        )}
      </Button>
    </div>
  )
}

export const EmbeddingInfoField = () => {
  const record = useRecordContext()

  if (!record?.embedding_generated) {
    return (
      <Badge variant="secondary" className="text-xs">
        <XCircle className="w-3 h-3 mr-1" />
        No embedding
      </Badge>
    )
  }

  const model = record.embedding_model || 'unknown'
  const modelInfo = EMBEDDING_MODELS[model as EmbeddingModel]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {modelInfo?.name || model}
        </Badge>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {record.embedding_dimensions}D
        </span>
        {record.embedding_updated_at && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(record.embedding_updated_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  )
}
