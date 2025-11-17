import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Badge } from '../../../components/ui/badge'
import { Copy, CheckCircle2, Webhook, Loader2 } from 'lucide-react'
import { useToast } from '../../../hooks/use-toast'
import type { CMSConnector, CMSConfig, WebhookConfig } from '../../../types/cms'

interface WebhookSetupProps {
  connector: CMSConnector
  config: CMSConfig
  connectionId: string
}

export const WebhookSetup = ({ connector, config, connectionId }: WebhookSetupProps) => {
  const { toast } = useToast()
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [settingUp, setSettingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate webhook URL for this connection
  const webhookUrl = `${window.location.origin}/api/cms-webhook/${connectionId}`

  const handleSetup = async () => {
    if (!connector.setupWebhook) {
      setError('This connector does not support automatic webhook setup')
      return
    }

    setSettingUp(true)
    setError(null)

    try {
      const config_result = await connector.setupWebhook(config, webhookUrl)
      setWebhookConfig(config_result)
      toast({
        title: 'Webhook Setup Complete',
        description: 'Webhook has been configured successfully'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to setup webhook'
      setError(message)
      toast({
        title: 'Setup Failed',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setSettingUp(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Setup
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure real-time syncing via webhooks
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Webhook URL</Label>
          <div className="flex gap-2">
            <Input value={webhookUrl} readOnly />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(webhookUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use this URL when configuring webhooks in your CMS
          </p>
        </div>

        {connector.setupWebhook ? (
          <div className="space-y-4">
            <Button
              onClick={handleSetup}
              disabled={settingUp}
              variant="default"
            >
              {settingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  <Webhook className="mr-2 h-4 w-4" />
                  Auto-Setup Webhook
                </>
              )}
            </Button>

            {webhookConfig && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Webhook configured successfully!</p>
                    <div className="space-y-1 text-sm">
                      <p>Events: {webhookConfig.events.join(', ')}</p>
                      {webhookConfig.secret && (
                        <div className="space-y-1">
                          <p className="font-medium">Secret:</p>
                          <code className="block p-2 bg-muted rounded text-xs">
                            {webhookConfig.secret}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              <p className="font-medium mb-2">Manual Webhook Setup Required</p>
              <p className="text-sm">
                This connector doesn't support automatic webhook setup.
                Please configure webhooks manually in your CMS settings using the URL above.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Supported Events</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Create</Badge>
            <Badge variant="secondary">Update</Badge>
            <Badge variant="secondary">Delete</Badge>
            <Badge variant="secondary">Publish</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
