import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  FunctionField,
  useListContext,
} from 'react-admin'
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material'
import {
  UserPlus,
  UserMinus,
  Shield,
  FileText,
  Settings,
  Mail,
  Database,
  Activity,
} from 'lucide-react'

const actionIcons: Record<string, any> = {
  INSERT: <UserPlus size={16} />,
  UPDATE: <Shield size={16} />,
  DELETE: <UserMinus size={16} />,
  CREATE: <FileText size={16} />,
  SEND: <Mail size={16} />,
  MODIFY: <Settings size={16} />,
}

const actionColors: Record<string, string> = {
  INSERT: '#10b981',
  UPDATE: '#3b82f6',
  DELETE: '#ef4444',
  CREATE: '#8b5cf6',
  SEND: '#f59e0b',
  MODIFY: '#6b7280',
}

const ActivityIcon = ({ action }: { action: string }) => {
  const icon = actionIcons[action] || <Activity size={16} />
  const color = actionColors[action] || '#6b7280'

  return (
    <Avatar sx={{ width: 32, height: 32, bgcolor: color }}>
      {icon}
    </Avatar>
  )
}

const ActivityDescription = ({ record }: { record?: any }) => {
  if (!record) return null

  const getDescription = () => {
    const { action, resource_type } = record

    switch (action) {
      case 'INSERT':
        if (resource_type === 'user_tenants') {
          return 'added a new team member'
        }
        if (resource_type === 'team_invitations') {
          return 'sent a team invitation'
        }
        return `created a new ${resource_type}`
      case 'UPDATE':
        if (resource_type === 'user_tenants') {
          return 'changed team member role'
        }
        if (resource_type === 'team_invitations') {
          return 'updated an invitation'
        }
        return `updated ${resource_type}`
      case 'DELETE':
        if (resource_type === 'user_tenants') {
          return 'removed a team member'
        }
        if (resource_type === 'team_invitations') {
          return 'cancelled an invitation'
        }
        return `deleted ${resource_type}`
      default:
        return `${action.toLowerCase()} ${resource_type}`
    }
  }

  return <Typography variant="body2">{getDescription()}</Typography>
}

const ActivityDetails = ({ record }: { record?: any }) => {
  if (!record || !record.new_values) return null

  const getValue = (key: string) => {
    if (record.new_values && key in record.new_values) {
      return record.new_values[key]
    }
    if (record.old_values && key in record.old_values) {
      return record.old_values[key]
    }
    return null
  }

  if (record.resource_type === 'user_tenants') {
    const role = getValue('role')
    const email = getValue('email')

    return (
      <Box sx={{ mt: 1 }}>
        {email && (
          <Typography variant="caption" color="text.secondary">
            User: {email}
          </Typography>
        )}
        {role && (
          <Chip
            label={role}
            size="small"
            sx={{ ml: 1, textTransform: 'capitalize' }}
          />
        )}
      </Box>
    )
  }

  if (record.resource_type === 'team_invitations') {
    const email = getValue('email')
    const role = getValue('role')
    const status = getValue('status')

    return (
      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {email && (
          <Typography variant="caption" color="text.secondary">
            To: {email}
          </Typography>
        )}
        {role && (
          <Chip
            label={role}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        )}
        {status && (
          <Chip
            label={status}
            size="small"
            color={status === 'accepted' ? 'success' : 'default'}
            sx={{ textTransform: 'capitalize' }}
          />
        )}
      </Box>
    )
  }

  return null
}

const ActivityItem = ({ record }: { record?: any }) => {
  if (!record) return null

  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2, borderBottom: '1px solid #e5e7eb' }}>
      <ActivityIcon action={record.action} />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReferenceField
            source="user_id"
            reference="profiles"
            link={false}
            record={record}
          >
            <TextField source="full_name" />
          </ReferenceField>
          <ActivityDescription record={record} />
        </Box>
        <ActivityDetails record={record} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {new Date(record.created_at).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  )
}

const ActivityGrid = () => {
  const { data, isLoading } = useListContext()

  if (isLoading) {
    return <Typography>Loading activities...</Typography>
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No activities yet
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {data.map((record: any) => (
        <ActivityItem key={record.id} record={record} />
      ))}
    </Card>
  )
}

export const ActivityFeed = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    perPage={50}
    pagination={false}
  >
    <ActivityGrid />
  </List>
)
