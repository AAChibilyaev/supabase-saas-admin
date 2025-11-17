import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { CMSConnector, CMSConfig } from '../../../types/cms'

interface ConnectionTestProps {
  connector: CMSConnector
  config: CMSConfig
}

export const ConnectionTest = ({ connector, config }: ConnectionTestProps) => {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      const testResult = await connector.testConnection(config)
      setResult(testResult)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleTest}
        disabled={testing || !config.url || !config.apiKey}
        variant="outline"
      >
        {testing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing Connection...
          </>
        ) : (
          'Test Connection'
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.message || (result.success ? 'Connection successful!' : 'Connection failed')}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  )
}
