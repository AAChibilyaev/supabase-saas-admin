import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  FunctionField,
  TopToolbar,
  DeleteButton,
  usePermissions,
  useUpdate,
  useNotify,
  useRefresh,
  useRecordContext,
} from 'react-admin'
import { Card, CardContent, Typography, Box, Divider } from '@mui/material'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import type { UserPermissions } from '../../types/permissions'
import { CheckCircle, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { sendNotificationEmail, EmailType } from '../../services/email'

const ContactMessageShowActions = () => {
  const { permissions } = usePermissions<UserPermissions>()
  const record = useRecordContext()
  const refresh = useRefresh()
  const notify = useNotify()
  const [update, { isLoading }] = useUpdate()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(record?.status || 'new')

  useEffect(() => {
    if (record?.status) {
      setSelectedStatus(record.status)
    }
  }, [record?.status])

  const handleStatusChange = async (newStatus: string) => {
    if (!record) return

    try {
      await update(
        'contact_messages',
        {
          id: record.id,
          data: { status: newStatus },
        },
        {
          onSuccess: () => {
            notify('Status updated successfully', { type: 'success' })
            setStatusOpen(false)
            refresh()
          },
          onError: () => {
            notify('Failed to update status', { type: 'error' })
          },
        }
      )
    } catch {
      notify('Failed to update status', { type: 'error' })
    }
  }

  const handleReply = async () => {
    if (!record || !replyMessage.trim()) return

    try {
      // Send reply email
      await sendNotificationEmail({
        type: EmailType.NOTIFICATION,
        email: record.email,
        title: `Re: ${record.subject}`,
        body: replyMessage,
        priority: 'medium',
      })

      // Update message status to 'replied'
      await update(
        'contact_messages',
        {
          id: record.id,
          data: { status: 'replied' },
        },
        {
          onSuccess: () => {
            notify('Reply sent successfully', { type: 'success' })
            setReplyOpen(false)
            setReplyMessage('')
            refresh()
          },
          onError: () => {
            notify('Failed to send reply', { type: 'error' })
          },
        }
      )
    } catch {
      notify('Failed to send reply', { type: 'error' })
    }
  }

  return (
    <TopToolbar>
      <div className="flex gap-2">
        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Message</DialogTitle>
              <DialogDescription>
                Send a reply to {record?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reply-message">Message</Label>
                <Textarea
                  id="reply-message"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReply} disabled={isLoading || !replyMessage.trim()}>
                Send Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Change Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Status</DialogTitle>
              <DialogDescription>
                Update the status of this message
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusChange(selectedStatus)}
                disabled={isLoading || selectedStatus === record?.status}
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {permissions?.canAccess('contact_messages', 'delete') && (
          <DeleteButton
            mutationMode="pessimistic"
            confirmTitle="Delete Message"
            confirmContent="Are you sure you want to delete this message? This action cannot be undone."
          />
        )}
      </div>
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
