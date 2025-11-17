import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Alert } from '../../components/ui/alert'
import { Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react'

interface ApiKeyValueProps {
  value: string
}

export const ApiKeyValue = ({ value }: ApiKeyValueProps) => {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <Alert variant="default" className="bg-yellow-50 border-yellow-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-semibold text-yellow-900">
              SAVE THIS KEY NOW!
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              This is the only time you'll see this API key. Store it securely - you won't be able to retrieve it again.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-3 rounded border border-yellow-200">
            <code className="flex-1 text-sm font-mono break-all">
              {visible ? value : '•'.repeat(Math.min(value.length, 40))}
            </code>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setVisible(!visible)}
                type="button"
                title={visible ? 'Hide key' : 'Show key'}
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyToClipboard}
                type="button"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
                {copied && <span className="ml-1 text-xs">Copied!</span>}
              </Button>
            </div>
          </div>

          <div className="text-xs text-yellow-700 space-y-1">
            <p className="font-medium">Security Best Practices:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Store this key in a secure location (password manager, secrets vault)</li>
              <li>Never commit this key to version control</li>
              <li>Use environment variables in your applications</li>
              <li>Rotate keys periodically for enhanced security</li>
            </ul>
          </div>
        </div>
      </div>
    </Alert>
  )
}
