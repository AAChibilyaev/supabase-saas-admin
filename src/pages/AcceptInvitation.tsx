import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabaseClient } from '../providers/supabaseClient'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import { CheckCircle, XCircle, Clock, Building2, Shield } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  tenant_id: string
  message?: string
  tenants?: {
    id: string
    name: string
    slug: string
    plan_type: string
  }
}

export const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadInvitation = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabaseClient
        .from('team_invitations')
        .select('*, tenants(*)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (fetchError) {
        setError('Invitation not found or already used')
        setLoading(false)
        return
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      setInvitation(data)
      setLoading(false)
    } catch (err: unknown) {
      console.error('Error loading invitation:', err instanceof Error ? err.message : 'Unknown error')
      setError('Failed to load invitation')
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadInvitation()
  }, [loadInvitation])

  const acceptInvitation = async () => {
    if (!invitation) return

    try {
      setProcessing(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser()

      if (!user) {
        // Redirect to login with invitation token
        navigate(`/login?invite=${token}`)
        return
      }

      // Check if user email matches invitation email
      if (user.email !== invitation.email) {
        setError(
          `This invitation is for ${invitation.email}. Please sign in with that email address.`
        )
        setProcessing(false)
        return
      }

      // Call the accept_invitation function
      const { data: { success, error: acceptError } } = await supabaseClient.rpc(
        'accept_invitation',
        {
          p_token: token as string,
          p_user_id: user.id as string,
        }
      ) as { data: { success: boolean; error: string | undefined } }

      if (acceptError) {
        setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept invitation')
        setProcessing(false)
        return
      }

      if (!data?.success || !(data as unknown as { success: boolean }).success) {
        setError(data?.error ? (data.error as unknown as string) : 'Failed to accept invitation')
        setProcessing(false)
        return
      }

      setSuccess(true)
      setProcessing(false)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err: unknown) {
      console.error('Error accepting invitation:', err instanceof Error ? err.message : 'Unknown error')
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
      setProcessing(false)
    }
  }

  const declineInvitation = async () => {
    if (!invitation) return

    try {
      setProcessing(true)

      const { error: updateError } = await supabaseClient
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id)

      if (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Failed to decline invitation')
        setProcessing(false)
        return
      }

      navigate('/')
    } catch (err: unknown) {
      console.error('Error declining invitation:', err instanceof Error ? err.message : 'Unknown error')
      setError(err instanceof Error ? err.message : 'Failed to decline invitation')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error && !invitation) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          padding: 3,
        }}
      >
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <XCircle size={64} color="#ef4444" style={{ marginBottom: 16 }} />
              <Typography variant="h5" gutterBottom>
                Invalid Invitation
              </Typography>
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                sx={{ mt: 3 }}
              >
                Go to Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          padding: 3,
        }}
      >
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
              <Typography variant="h5" gutterBottom>
                Welcome to the Team!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                You've successfully joined {invitation?.tenants?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Redirecting to dashboard...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: 3,
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Team Invitation
          </Typography>
          <Typography variant="body2">
            You've been invited to join a team
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Building2 size={20} color="#667eea" />
              <Typography variant="h6">{invitation?.tenants?.name}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {invitation?.tenants?.slug}
            </Typography>
          </Box>

          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f9fafb', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Email:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {invitation?.email}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Role:
              </Typography>
              <Chip
                icon={<Shield size={14} />}
                label={invitation?.role}
                size="small"
                color="primary"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>

            {invitation?.message && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Message:
                </Typography>
                <Typography variant="body2">{invitation.message}</Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={16} color="#6b7280" />
              <Typography variant="body2" color="text.secondary">
                Expires: {new Date(invitation?.expires_at || '').toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={declineInvitation}
              disabled={processing}
              color="error"
            >
              Decline
            </Button>
            <Button
              variant="contained"
              onClick={acceptInvitation}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={16} /> : <CheckCircle size={16} />}
            >
              {processing ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 3, textAlign: 'center' }}
          >
            By accepting, you'll have {invitation?.role} access to {invitation?.tenants?.name}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
