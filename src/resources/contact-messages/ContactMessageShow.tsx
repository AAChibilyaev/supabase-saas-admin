import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  FunctionField,
  TopToolbar,
  EditButton,
  DeleteButton,
  usePermissions,
} from 'react-admin'
import { Card, CardContent, Typography, Box, Divider } from '@mui/material'
import { Badge } from '../../components/ui/badge'
import type { UserPermissions } from '../../types/permissions'

const ContactMessageShowActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      {permissions?.canAccess('contact_messages', 'delete') && (
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle="Delete Message"
          confirmContent="Are you sure you want to delete this message? This action cannot be undone."
        />
      )}
    </TopToolbar>
  )
}

const StatusBadge = ({ record }: { record?: any }) => {
  if (!record) return null

  const status = record.status || 'new'
  const variant = status === 'new' ? 'default' :
                  status === 'read' ? 'secondary' : 'outline'

  return <Badge variant={variant}>{status}</Badge>
}

const MessageBody = ({ record }: { record?: any }) => {
  if (!record || !record.body) return null

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Message
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {record.body}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export const ContactMessageShow = () => {
  return (
    <Show actions={<ContactMessageShowActions />}>
      <SimpleShowLayout>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Contact Message Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Name
            </Typography>
            <TextField source="name" />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Email
            </Typography>
            <EmailField source="email" />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Subject
            </Typography>
            <TextField source="subject" />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <FunctionField render={(record: any) => <StatusBadge record={record} />} />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Submitted At
            </Typography>
            <DateField source="created_at" showTime />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Updated
            </Typography>
            <DateField source="updated_at" showTime />
          </Box>
        </Box>

        <FunctionField render={(record: any) => <MessageBody record={record} />} />
      </SimpleShowLayout>
    </Show>
  )
}
