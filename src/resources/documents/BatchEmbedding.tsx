import { useState } from 'react'
import { useListContext, useNotify, useRefresh, useUnselectAll } from 'react-admin'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Sparkles, AlertCircle, CheckCircle2, XCircle, DollarSign, Zap } from 'lucide-react'
import { supabaseClient } from '../../providers/supabaseClient'
import { EMBEDDING_MODELS } from '../../services/openai'
import type { EmbeddingModel } from '../../services/openai'
import type { EmbeddingResult } from '../../services/openai'

export const BatchEmbeddingButton = () => {
  const { selectedIds } = useListContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('documents')

  const [open, setOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [model, setModel] = useState<EmbeddingModel>('text-embedding-3-small')
  const [forceRegenerate, setForceRegenerate] = useState(false)
  const [results, setResults] = useState<EmbeddingResult[] | null>(null)

  const handleBatchGenerate = async () => {
    setProcessing(true)
    setResults(null)

    try {
      const { data, error } = await supabaseClient.functions.invoke('generate-batch-embeddings', {
        body: {
          documentIds: selectedIds,
          model,
          forceRegenerate,
          batchSize: 10,
        },
      })

      if (error) throw error

      if (data?.success) {
        setResults(data.results.details)
        notify(
          `Batch complete! ${data.results.successful} successful, ${data.results.failed} failed, ${data.results.skipped} skipped`,
          { type: 'success' }
        )
        refresh()
        unselectAll()
      }
    } catch (error: unknown) {
      console.error('Failed to generate batch embeddings:', error)
      notify(error instanceof Error ? error.message : 'Failed to generate batch embeddings', { type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  const modelInfo = EMBEDDING_MODELS[model]
  const selectedCount = selectedIds.length

  if (selectedCount === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Embeddings ({selectedCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch Generate Embeddings</DialogTitle>
          <DialogDescription>
            Generate vector embeddings for {selectedCount} selected document{selectedCount > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Embedding Model</label>
            <Select value={model} onValueChange={(value) => setModel(value as EmbeddingModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EMBEDDING_MODELS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center justify-between w-full">
                      <span>{info.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        ${info.costPer1M}/1M tokens
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">{modelInfo.description}</p>
          </div>

          {/* Model Info Card */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500">Dimensions</div>
                <div className="text-sm font-semibold">{modelInfo.dimensions}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Max Tokens</div>
                <div className="text-sm font-semibold">{modelInfo.maxTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Cost per 1M tokens</div>
                <div className="text-sm font-semibold flex items-center">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {modelInfo.costPer1M.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Documents</div>
                <div className="text-sm font-semibold">{selectedCount}</div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="forceRegenerate"
              checked={forceRegenerate}
              onChange={(e) => setForceRegenerate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="forceRegenerate" className="text-sm cursor-pointer">
              Force regenerate existing embeddings
            </label>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Batch Processing Complete
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Successful: {results.filter(result => result.success).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Failed: {results.filter(result => !result.success).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span>Skipped: {results.filter(result => result.error).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Tokens: {results.reduce((acc, result) => acc + result.tokens, 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-300">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total Cost:</span>
                  <span className="font-mono font-bold flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {results.reduce((acc, result) => acc + (result.tokens / 1_000_000) * modelInfo.costPer1M, 0).toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Processing Time:</span>
                  <span className="font-mono">
                    {(results.reduce((acc, result) => acc + (result.processingTime ?? 0), 0) / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Processing...</div>
              <Progress value={undefined} className="w-full" />
              <p className="text-xs text-gray-500">
                Generating embeddings for {selectedCount} documents
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button onClick={handleBatchGenerate} disabled={processing}>
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Embeddings
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
