import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  ReferenceField,
  FunctionField,
  TopToolbar,
  DeleteButton,
  usePermissions,
  Button,
  useRefresh,
  useNotify,
  useRecordContext,
  useUpdate,
} from 'react-admin'
import { Card, CardContent, Typography, Box, Divider } from '@mui/material'
import { Badge } from '../../components/ui/badge'
import type { UserPermissions } from '../../types/permissions'
import { RefreshCw, CheckCircle } from 'lucide-react'

const SyncErrorShowActions = () => {
  const { permissions } = usePermissions<UserPermissions>()
  const record = useRecordContext()
  const refresh = useRefresh()
  const notify = useNotify()
  const [update, { isLoading }] = useUpdate()

  const handleRetry = async () => {
    if (!record) return

    try {
      await update(
        'sync_errors',
        {
          id: record.id,
          data: {
            retry_count: (record.retry_count || 0) + 1,
            last_attempt_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            notify('Retry initiated successfully', { type: 'success' })
            refresh()
          },
          onError: () => {
            notify('Failed to retry sync', { type: 'error' })
          },
        }
      )
    } catch (error) {
      notify('Failed to retry sync', { type: 'error' })
    }
  }

  const handleMarkResolved = async () => {
    if (!record) return

    try {
      await update(
        'sync_errors',
        {
          id: record.id,
          data: {
            resolved_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            notify('Marked as resolved', { type: 'success' })
            refresh()
          },
          onError: () => {
            notify('Failed to mark as resolved', { type: 'error' })
          },
        }
      )
    } catch (error) {
      notify('Failed to mark as resolved', { type: 'error' })
    }
  }

  return (
    <TopToolbar>
      {permissions?.canAccess('sync_errors', 'edit') && !record?.resolved_at && (
        <>
          <Button
            label="Retry"
            onClick={handleRetry}
            disabled={isLoading}
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            label="Mark as Resolved"
            onClick={handleMarkResolved}
            disabled={isLoading}
          >
            <CheckCircle size={16} />
          </Button>
        </>
      )}
      {permissions?.canAccess('sync_errors', 'delete') && (
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle="Delete Sync Error"
          confirmContent="Are you sure you want to delete this sync error record? This action cannot be undone."
        />
      )}
    </TopToolbar>
  )
}

const OperationBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const operation = record.operation_type
  const variant = operation === 'INSERT' ? 'default' :
                  operation === 'UPDATE' ? 'secondary' : 'outline'

  return <Badge variant={variant}>{operation}</Badge>
}

const ResolvedBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const isResolved = !!record.resolved_at
  const variant = isResolved ? 'secondary' : 'default'
  const label = isResolved ? 'Resolved' : 'Unresolved'

  return <Badge variant={variant}>{label}</Badge>
}

const ErrorMessageCard = ({ record }: { record?: any }) => {
  if (!record || !record.error_message) return null

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Error Message
      </Typography>
      <Card variant="outlined" sx={{ bgcolor: '#fef2f2' }}>
        <CardContent>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              color: '#dc2626',
            }}
          >
            {record.error_message}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

const ErrorDetailsCard = ({ record }: { record?: any }) => {
  if (!record || !record.error_details) return null

  let formattedDetails
  try {
    formattedDetails = JSON.stringify(record.error_details, null, 2)
  } catch {
    formattedDetails = String(record.error_details)
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Error Details (Stack Trace)
      </Typography>
      <Card variant="outlined" sx={{ bgcolor: '#fafafa' }}>
        <CardContent>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              margin: 0,
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            {formattedDetails}
          </pre>
        </CardContent>
      </Card>
    </Box>
  )
}

export const SyncErrorShow = () => {
  return (
    <Show actions={<SyncErrorShowActions />}>
      <SimpleShowLayout>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Sync Error Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Tenant
            </Typography>
            <ReferenceField source="tenant_id" reference="tenants" link="show">
              <TextField source="name" />
            </ReferenceField>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Document
            </Typography>
            <ReferenceField source="document_id" reference="documents" link="show">
              <TextField source="title" />
            </ReferenceField>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Operation Type
            </Typography>
            <FunctionField render={(record: any) => <OperationBadge record={record} />} />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <FunctionField render={(record: any) => <ResolvedBadge record={record} />} />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Retry Count
            </Typography>
            <TextField source="retry_count" />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Created At
            </Typography>
            <DateField source="created_at" showTime />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Attempt
            </Typography>
            <DateField source="last_attempt_at" showTime />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Resolved At
            </Typography>
            <DateField source="resolved_at" showTime emptyText="Not resolved" />
          </Box>
        </Box>

        <FunctionField render={(record: any) => <ErrorMessageCard record={record} />} />
        <FunctionField render={(record: any) => <ErrorDetailsCard record={record} />} />
      </SimpleShowLayout>
    </Show>
  )
}
