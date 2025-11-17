/**
 * Password Change Component
 * Allows users to change their password with validation
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { Key, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { supabaseClient } from '../../providers/supabaseClient'
import { validatePassword, type PasswordStrengthResult } from '../../utils/passwordValidation'

export function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null)
  const [checkingPassword, setCheckingPassword] = useState(false)

  const handlePasswordChange = async (value: string) => {
    setNewPassword(value)
    setError(null)
    setSuccess(null)

    if (!value) {
      setPasswordStrength(null)
      return
    }

    setCheckingPassword(true)
    const strength = await validatePassword(value)
    setPasswordStrength(strength)
    setCheckingPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (!passwordStrength || !passwordStrength.isValid) {
      setError('Password does not meet security requirements')
      return
    }

    if (passwordStrength.isBreached) {
      setError('This password has been compromised in a data breach. Please choose a different password.')
      return
    }

    setLoading(true)

    try {
      // Supabase requires re-authentication for password change
      // First verify the current password by attempting to sign in
      const { data: user } = await supabaseClient.auth.getUser()

      if (!user.user?.email) {
        setError('Unable to verify current user')
        setLoading(false)
        return
      }

      // Verify current password
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: user.user.email,
        password: currentPassword,
      })

      if (signInError) {
        setError('Current password is incorrect')
        setLoading(false)
        return
      }

      // Update to new password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordStrength(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500'
    if (score === 2) return 'bg-orange-500'
    if (score === 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return 'Weak'
    if (score === 2) return 'Fair'
    if (score === 3) return 'Good'
    return 'Strong'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <CardTitle>Change Password</CardTitle>
        </div>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password strength indicator */}
            {newPassword && passwordStrength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Password Strength:</span>
                  <span className={`text-sm font-medium ${
                    passwordStrength.isValid ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {getStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                <Progress
                  value={(passwordStrength.score / 4) * 100}
                  className={`h-2 ${getStrengthColor(passwordStrength.score)}`}
                />
                <ul className="text-sm space-y-1">
                  {passwordStrength.feedback.map((feedback, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2 ${
                        feedback.startsWith('Weak') || feedback.startsWith('Password must')
                          ? 'text-orange-600'
                          : feedback.startsWith('Good')
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {feedback.startsWith('Password must') ? (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{feedback}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {checkingPassword && (
              <p className="text-sm text-muted-foreground">Checking password security...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-orange-600">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={
              loading ||
              checkingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              !passwordStrength?.isValid
            }
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
