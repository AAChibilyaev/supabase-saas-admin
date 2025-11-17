import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  SelectField,
  ReferenceField,
  FunctionField,
  useNotify,
  useRefresh,
  useDataProvider,
  Button,
  DeleteButton,
} from 'react-admin'
import { Chip, Box } from '@mui/material'
import { Mail, Copy, XCircle } from 'lucide-react'

const statusChoices = [
  { id: 'pending', name: 'Pending' },
  { id: 'accepted', name: 'Accepted' },
  { id: 'declined', name: 'Declined' },
  { id: 'expired', name: 'Expired' },
  { id: 'cancelled', name: 'Cancelled' },
]

const roleChoices = [
  { id: 'member', name: 'Member' },
  { id: 'admin', name: 'Admin' },
  { id: 'owner', name: 'Owner' },
]

const StatusChip = ({ record }: { record?: any }) => {
  if (!record) return null

  const colorMap: Record<string, string> = {
    pending: '#fbbf24',
    accepted: '#10b981',
    declined: '#ef4444',
    expired: '#6b7280',
    cancelled: '#6b7280',
  }

  return (
    <Chip
      label={record.status}
      size="small"
      sx={{
        backgroundColor: colorMap[record.status] || '#6b7280',
        color: 'white',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    />
  )
}

const CopyLinkButton = ({ record }: { record?: any }) => {
  const notify = useNotify()

  if (!record || record.status !== 'pending') return null

  const handleCopy = async () => {
    const inviteUrl = `${window.location.origin}/accept-invite/${record.token}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      notify('Invitation link copied to clipboard', { type: 'success' })
    } catch (error) {
      notify('Failed to copy link', { type: 'error' })
    }
  }

  return (
    <Button
      label="Copy Link"
      onClick={handleCopy}
      startIcon={<Copy size={16} />}
      size="small"
    />
  )
}

const ResendButton = ({ record }: { record?: any }) => {
  const notify = useNotify()
  const refresh = useRefresh()
  const dataProvider = useDataProvider()

  if (!record || record.status !== 'pending') return null

  const handleResend = async () => {
    try {
      // Update the invitation to trigger email resend
      await dataProvider.update('team_invitations', {
        id: record.id,
        data: { ...record, resend: true },
        previousData: record,
      })
      notify('Invitation resent successfully', { type: 'success' })
      refresh()
    } catch (error) {
      notify('Failed to resend invitation', { type: 'error' })
    }
  }

  return (
    <Button
      label="Resend"
      onClick={handleResend}
      startIcon={<Mail size={16} />}
      size="small"
    />
  )
}

const CancelButton = ({ record }: { record?: any }) => {
  const notify = useNotify()
  const refresh = useRefresh()
  const dataProvider = useDataProvider()

  if (!record || record.status !== 'pending') return null

  const handleCancel = async () => {
    try {
      await dataProvider.update('team_invitations', {
        id: record.id,
        data: { ...record, status: 'cancelled' },
        previousData: record,
      })
      notify('Invitation cancelled', { type: 'success' })
      refresh()
    } catch (error) {
      notify('Failed to cancel invitation', { type: 'error' })
    }
  }

  return (
    <Button
      label="Cancel"
      onClick={handleCancel}
      startIcon={<XCircle size={16} />}
      size="small"
      color="error"
    />
  )
}

export const InvitationList = () => (
  <List sort={{ field: 'created_at', order: 'DESC' }}>
    <Datagrid>
      <EmailField source="email" />
      <SelectField source="role" choices={roleChoices} />
      <FunctionField
        label="Status"
        render={(record: any) => <StatusChip record={record} />}
      />
      <DateField source="created_at" showTime />
      <DateField source="expires_at" showTime />
      <ReferenceField
        source="invited_by"
        reference="profiles"
        label="Invited By"
        link={false}
      >
        <TextField source="full_name" />
      </ReferenceField>
      <FunctionField
        label="Actions"
        render={(record: any) => (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <CopyLinkButton record={record} />
            <ResendButton record={record} />
            <CancelButton record={record} />
          </Box>
        )}
      />
    </Datagrid>
  </List>
)
