/**
 * Account Recovery Component
 * Provides backup codes and recovery options
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { LifeBuoy, AlertCircle, CheckCircle2, Download, Copy, RefreshCw } from 'lucide-react'
import { supabaseClient } from '../../providers/supabaseClient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'

interface RecoveryCode {
  code: string
  used: boolean
}

export function AccountRecovery() {
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showCodesDialog, setShowCodesDialog] = useState(false)
  const [newCodes, setNewCodes] = useState<string[]>([])

  useEffect(() => {
    loadRecoveryCodes()
  }, [])

  const loadRecoveryCodes = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()

      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      // Check if user has recovery codes in user_metadata
      const codes = user.user_metadata?.recovery_codes || []
      setRecoveryCodes(codes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recovery codes')
    } finally {
      setLoading(false)
    }
  }

  const generateRecoveryCodes = (): string[] => {
    const codes: string[] = []
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding ambiguous characters

    for (let i = 0; i < 10; i++) {
      let code = ''
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      // Format as XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }

    return codes
  }

  const handleGenerateCodes = async () => {
    setGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const codes = generateRecoveryCodes()
      const recoveryCodesData = codes.map(code => ({ code, used: false }))

      // Save to user metadata
      const { error: updateError } = await supabaseClient.auth.updateUser({
        data: {
          recovery_codes: recoveryCodesData,
        },
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setNewCodes(codes)
        setShowConfirmDialog(false)
        setShowCodesDialog(true)
        await loadRecoveryCodes()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recovery codes')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadCodes = () => {
    const content = newCodes.length > 0 ? newCodes : recoveryCodes.map(c => c.code)
    const text = `Account Recovery Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${content.join('\n')}

Keep these codes secure and do not share them with anyone.
`

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recovery-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setSuccess('Recovery codes downloaded')
  }

  const handleCopyCodes = () => {
    const content = newCodes.length > 0 ? newCodes : recoveryCodes.map(c => c.code)
    navigator.clipboard.writeText(content.join('\n'))
    setSuccess('Recovery codes copied to clipboard')
  }

  const unusedCodes = recoveryCodes.filter(c => !c.used)
  const usedCodes = recoveryCodes.filter(c => c.used)

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading recovery options...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            <CardTitle>Account Recovery</CardTitle>
          </div>
          <CardDescription>
            Generate backup codes to recover your account if you lose access to your MFA device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {recoveryCodes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have any recovery codes. Generate codes now to ensure you can recover your account.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recovery Codes Status</p>
                  <p className="text-sm text-muted-foreground">
                    {unusedCodes.length} of {recoveryCodes.length} codes remaining
                  </p>
                </div>
                <Badge variant={unusedCodes.length > 5 ? 'default' : 'destructive'}>
                  {unusedCodes.length > 5 ? 'Good' : 'Low'}
                </Badge>
              </div>

              {unusedCodes.length <= 3 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You're running low on recovery codes. Generate new codes soon.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-2">
                {unusedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-muted rounded font-mono text-sm text-center"
                  >
                    {code.code}
                  </div>
                ))}
              </div>

              {usedCodes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Used Codes ({usedCodes.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {usedCodes.map((code, index) => (
                      <div
                        key={index}
                        className="p-2 bg-muted/50 rounded font-mono text-sm text-center line-through text-muted-foreground"
                      >
                        {code.code}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCodes}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCodes}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Codes
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowConfirmDialog(true)}
            variant={recoveryCodes.length > 0 ? 'outline' : 'default'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {recoveryCodes.length > 0 ? 'Regenerate Recovery Codes' : 'Generate Recovery Codes'}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Store recovery codes in a safe place. Each code can only be used once.
              If you regenerate codes, all previous codes will be invalidated.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {recoveryCodes.length > 0 ? 'Regenerate Recovery Codes?' : 'Generate Recovery Codes?'}
            </DialogTitle>
            <DialogDescription>
              {recoveryCodes.length > 0 ? (
                <>
                  This will invalidate all existing recovery codes and generate new ones.
                  Make sure to save the new codes in a safe place.
                </>
              ) : (
                <>
                  This will generate 10 recovery codes that you can use to access your account
                  if you lose access to your MFA device.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCodes}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Codes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New codes display dialog */}
      <Dialog open={showCodesDialog} onOpenChange={setShowCodesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Recovery Codes</DialogTitle>
            <DialogDescription>
              Store these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure to save these codes now. You won't be able to see them again!
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded">
              {newCodes.map((code, index) => (
                <div
                  key={index}
                  className="p-2 bg-background rounded font-mono text-sm text-center"
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyCodes}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadCodes}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowCodesDialog(false)
              setNewCodes([])
            }}>
              I've Saved My Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
