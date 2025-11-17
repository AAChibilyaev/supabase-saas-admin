import {
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  NumberField,
  FunctionField,
  FilterButton,
  CreateButton,
  ExportButton,
  TopToolbar,
  TextInput,
  BooleanInput,
  SelectInput,
  EditButton,
  DeleteButton,
  useRecordContext,
  useNotify,
  useRefresh,
  useDataProvider,
} from 'react-admin'
import { Box, Chip, IconButton, Tooltip } from '@mui/material'
import { Code, Eye, TrendingUp, Copy } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'

const WidgetListActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
    <CreateButton label="Create Widget" />
  </TopToolbar>
)

const widgetFilters = [
  <TextInput key="search" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="type"
    label="Widget Type"
    source="type"
    choices={[
      { id: 'search', name: 'Search Widget' },
      { id: 'faceted-search', name: 'Faceted Search' },
      { id: 'autocomplete', name: 'Autocomplete' },
      { id: 'instant-search', name: 'Instant Search' },
    ]}
  />,
  <BooleanInput key="is_active" label="Active" source="is_active" />,
]

// Widget Type Badge Component
const WidgetTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    'search': 'bg-blue-100 text-blue-800',
    'faceted-search': 'bg-purple-100 text-purple-800',
    'autocomplete': 'bg-green-100 text-green-800',
    'instant-search': 'bg-orange-100 text-orange-800',
  }

  return (
    <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
      {type.replace('-', ' ')}
    </Badge>
  )
}

// Embed Code Dialog Component
const EmbedCodeDialog = ({ record }: { record: any }) => {
  const [open, setOpen] = useState(false)
  const notify = useNotify()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    notify('Copied to clipboard', { type: 'success' })
  }

  if (!record) return null

  return (
    <>
      <Tooltip title="View Embed Code">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <Code className="w-4 h-4" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Embed Code: {record.name}</DialogTitle>
            <DialogDescription>
              Copy and paste this code into your website
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {record.embed_code && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Generated Code</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(record.embed_code)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {record.embed_code}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Widget Actions Component
const WidgetActions = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <Box display="flex" gap={1}>
      <EmbedCodeDialog record={record} />
      <EditButton />
      <DeleteButton />
    </Box>
  )
}

export const WidgetList = () => {
  return (
    <List
      filters={widgetFilters}
      actions={<WidgetListActions />}
      sort={{ field: 'created_at', order: 'DESC' }}
      perPage={25}
    >
      <Datagrid bulkActionButtons={false} rowClick="edit">
        <TextField source="name" label="Widget Name" />
        <FunctionField
          source="type"
          label="Type"
          render={(record: any) => <WidgetTypeBadge type={record.type} />}
        />
        <TextField source="description" label="Description" />
        <FunctionField
          source="is_active"
          label="Status"
          render={(record: any) => (
            <Badge className={record.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {record.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
        />
        <NumberField source="usage_count" label="Usage Count" />
        <DateField source="last_used_at" label="Last Used" showTime />
        <DateField source="created_at" label="Created" showTime />
        <WidgetActions />
      </Datagrid>
    </List>
  )
}
