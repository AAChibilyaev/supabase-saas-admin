/**
 * MFA Setup Component
 * Allows users to enable and configure multi-factor authentication
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Shield, AlertCircle, CheckCircle2, Smartphone, Trash2 } from 'lucide-react'
import {
  enrollMFAFactor,
  verifyMFAEnrollment,
  getMFAFactors,
  unenrollMFAFactor,
  type MFAFactor,
} from '../../utils/mfaHelpers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'

export function MFASetup() {
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [factorToDelete, setFactorToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadMFAFactors()
  }, [])

  const loadMFAFactors = async () => {
    setLoading(true)
    const { factors: loadedFactors, error } = await getMFAFactors()

    if (error) {
      setError(error)
    } else {
      setFactors(loadedFactors)
    }

    setLoading(false)
  }

  const handleEnrollMFA = async () => {
    setEnrolling(true)
    setError(null)
    setSuccess(null)

    const result = await enrollMFAFactor('Authenticator App')

    if (result.success && result.qrCode && result.secret && result.factorId) {
      setQrCode(result.qrCode)
      setSecret(result.secret)
      setFactorId(result.factorId)
    } else {
      setError(result.error || 'Failed to enroll MFA')
      setEnrolling(false)
    }
  }

  const handleVerifyEnrollment = async () => {
    if (!factorId || !verificationCode) {
      setError('Please enter verification code')
      return
    }

    setError(null)
    const result = await verifyMFAEnrollment(factorId, verificationCode)

    if (result.success) {
      setSuccess('MFA enabled successfully!')
      setQrCode(null)
      setSecret(null)
      setFactorId(null)
      setVerificationCode('')
      setEnrolling(false)
      await loadMFAFactors()
    } else {
      setError(result.error || 'Invalid verification code')
    }
  }

  const handleCancelEnrollment = () => {
    setQrCode(null)
    setSecret(null)
    setFactorId(null)
    setVerificationCode('')
    setEnrolling(false)
    setError(null)
  }

  const handleDeleteFactor = async () => {
    if (!factorToDelete) return

    const result = await unenrollMFAFactor(factorToDelete)

    if (result.success) {
      setSuccess('MFA factor removed successfully')
      await loadMFAFactors()
    } else {
      setError(result.error || 'Failed to remove MFA factor')
    }

    setShowDeleteDialog(false)
    setFactorToDelete(null)
  }

  const confirmDelete = (factorId: string) => {
    setFactorToDelete(factorId)
    setShowDeleteDialog(true)
  }

  const verifiedFactors = factors.filter(f => f.status === 'verified')
  const hasVerifiedMFA = verifiedFactors.length > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading MFA settings...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Multi-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account with MFA
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

          {hasVerifiedMFA && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Multi-factor authentication is enabled on your account
              </AlertDescription>
            </Alert>
          )}

          {/* Existing factors */}
          {factors.length > 0 && (
            <div className="space-y-2">
              <Label>Active MFA Methods</Label>
              {factors.map(factor => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {factor.friendly_name || 'Authenticator App'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={factor.status === 'verified' ? 'default' : 'secondary'}>
                      {factor.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(factor.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enrollment form */}
          {!enrolling && (
            <Button onClick={handleEnrollMFA} disabled={loading}>
              <Shield className="h-4 w-4 mr-2" />
              Add Authenticator App
            </Button>
          )}

          {/* QR Code and verification */}
          {enrolling && qrCode && secret && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>Step 1: Scan QR Code</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center bg-white p-4 rounded-lg border">
                  <img src={qrCode} alt="MFA QR Code" className="max-w-[200px]" />
                </div>
              </div>

              <div>
                <Label>Or enter this secret key manually:</Label>
                <code className="block p-2 bg-muted rounded mt-1 text-sm break-all">
                  {secret}
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Step 2: Enter Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-wider"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyEnrollment}
                  disabled={verificationCode.length !== 6}
                >
                  Verify and Enable
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEnrollment}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove MFA Factor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this MFA factor? This will reduce the security of your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFactor}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
