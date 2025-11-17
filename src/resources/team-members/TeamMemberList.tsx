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
  useRecordContext,
} from 'react-admin'
import { Chip, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from '@mui/material'
import { useState } from 'react'
import { UserX, Shield, Crown } from 'lucide-react'
import { supabaseClient } from '../../providers/supabaseClient'
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription'

const roleChoices = [
  { id: 'member', name: 'Member' },
  { id: 'admin', name: 'Admin' },
  { id: 'owner', name: 'Owner' },
]

const RoleChip = ({ record }: { record?: any }) => {
  if (!record) return null

  const colorMap: Record<string, string> = {
    member: '#6b7280',
    admin: '#3b82f6',
    owner: '#8b5cf6',
  }

  const iconMap: Record<string, any> = {
    member: null,
    admin: <Shield size={14} />,
    owner: <Crown size={14} />,
  }

  return (
    <Chip
      label={record.role}
      icon={iconMap[record.role]}
      size="small"
      sx={{
        backgroundColor: colorMap[record.role] || '#6b7280',
        color: 'white',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    />
  )
}

const ChangeRoleButton = ({ record }: { record?: any }) => {
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(record?.role || 'member')
  const notify = useNotify()
  const refresh = useRefresh()
  const dataProvider = useDataProvider()

  if (!record) return null

  const handleChange = async () => {
    try {
      await dataProvider.update('user_tenants', {
        id: record.id,
        data: { role: selectedRole },
        previousData: record,
      })
      notify('Role updated successfully', { type: 'success' })
      setOpen(false)
      refresh()
    } catch (error) {
      notify('Failed to update role', { type: 'error' })
    }
  }

  return (
    <>
      <Button
        label="Change Role"
        onClick={() => setOpen(true)}
        startIcon={<Shield size={16} />}
        size="small"
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Change Member Role</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            >
              {roleChoices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.name}
                </option>
              ))}
            </select>
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={handleChange} variant="contained" color="primary">
            Update Role
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

const RemoveMemberButton = ({ record }: { record?: any }) => {
  const [open, setOpen] = useState(false)
  const notify = useNotify()
  const refresh = useRefresh()
  const dataProvider = useDataProvider()

  if (!record) return null

  const handleRemove = async () => {
    try {
      await dataProvider.delete('user_tenants', {
        id: record.id,
        previousData: record,
      })
      notify('Member removed successfully', { type: 'success' })
      setOpen(false)
      refresh()
    } catch (error) {
      notify('Failed to remove member', { type: 'error' })
    }
  }

  return (
    <>
      <Button
        label="Remove"
        onClick={() => setOpen(true)}
        startIcon={<UserX size={16} />}
        size="small"
        color="error"
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to remove this member from the team?</p>
          <p>This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={handleRemove} variant="contained" color="error">
            Remove Member
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}

export const TeamMemberList = () => {
  // Get current tenant for filtering
  const currentTenant = localStorage.getItem('supabase-admin:selected-tenant')

  // Enable real-time updates for team members with tenant filtering
  useRealtimeSubscription({
    resource: 'user_tenants',
    showNotifications: true,
    filter: currentTenant ? { column: 'tenant_id', value: currentTenant } : undefined,
  })

  return (
    <List
      sort={{ field: 'created_at', order: 'DESC' }}
      filter={{ tenant_id: currentTenant }}
    >
      <Datagrid>
        <ReferenceField
          source="user_id"
          reference="profiles"
          label="Name"
          link={false}
        >
          <TextField source="full_name" />
        </ReferenceField>
        <ReferenceField
          source="user_id"
          reference="profiles"
          label="Email"
          link={false}
        >
          <EmailField source="email" />
        </ReferenceField>
        <FunctionField
          label="Role"
          render={(record: any) => <RoleChip record={record} />}
        />
        <DateField source="created_at" label="Joined" showTime />
        <FunctionField
          label="Actions"
          render={(record: any) => (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <ChangeRoleButton record={record} />
              <RemoveMemberButton record={record} />
            </Box>
          )}
        />
      </Datagrid>
    </List>
  )
}
