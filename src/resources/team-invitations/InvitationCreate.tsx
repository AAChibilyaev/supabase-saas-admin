import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  required,
  email,
  useNotify,
  useRedirect,
  useDataProvider,
  SaveButton,
  Toolbar,
} from 'react-admin'
import { generateSecureToken } from '../../utils/token'
import { sendInvitationEmail } from '../../services/email'
import { supabaseClient } from '../../providers/supabaseClient'

const roleChoices = [
  { id: 'member', name: 'Member' },
  { id: 'admin', name: 'Admin' },
]

const InvitationCreateToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton label="Send Invitation" />
  </Toolbar>
)

export const InvitationCreate = () => {
  const notify = useNotify()
  const redirect = useRedirect()
  const dataProvider = useDataProvider()

  const handleSubmit = async (data: any) => {
    try {
      // Get current tenant
      const tenantId = localStorage.getItem('supabase-admin:selected-tenant')
      if (!tenantId) {
        notify('Please select a tenant first', { type: 'error' })
        return
      }

      // Get current user
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) {
        notify('User not authenticated', { type: 'error' })
        return
      }

      // Get tenant details
      const { data: tenant } = await dataProvider.getOne('tenants', {
        id: tenantId,
      })

      // Get user profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Generate secure token
      const token = generateSecureToken(64)

      // Create invitation
      const invitationData = {
        tenant_id: tenantId,
        email: data.email,
        role: data.role,
        token: token,
        invited_by: user.id,
        message: data.message,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const { data: invitation } = await dataProvider.create('team_invitations', {
        data: invitationData,
      })

      // Send invitation email
      try {
        await sendInvitationEmail({
          email: data.email,
          token: token,
          inviterName: profile?.full_name || user.email || 'Team member',
          tenantName: tenant.name,
          role: data.role,
          message: data.message,
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        notify('Invitation created but email failed to send', { type: 'warning' })
        redirect('list', 'team_invitations')
        return
      }

      notify('Invitation sent successfully', { type: 'success' })
      redirect('list', 'team_invitations')
    } catch (error: any) {
      console.error('Failed to create invitation:', error)
      notify(error.message || 'Failed to create invitation', { type: 'error' })
    }
  }

  return (
    <Create>
      <SimpleForm onSubmit={handleSubmit} toolbar={<InvitationCreateToolbar />}>
        <TextInput
          source="email"
          type="email"
          validate={[required(), email()]}
          fullWidth
          helperText="Email address of the person you want to invite"
        />
        <SelectInput
          source="role"
          choices={roleChoices}
          validate={required()}
          defaultValue="member"
          fullWidth
          helperText="Role determines the level of access"
        />
        <TextInput
          source="message"
          multiline
          rows={4}
          fullWidth
          helperText="Optional: Add a personal message to the invitation"
        />
      </SimpleForm>
    </Create>
  )
}
