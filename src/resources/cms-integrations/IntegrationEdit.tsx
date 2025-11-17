import { useState, useEffect } from 'react'
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  required,
  useRecordContext,
  useNotify
} from 'react-admin'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { ConnectionTest } from './components/ConnectionTest'
import { FieldMapper } from './components/FieldMapper'
import { SyncScheduler } from './components/SyncScheduler'
import { SyncHistory } from './components/SyncHistory'
import { WebhookSetup } from './components/WebhookSetup'
import { getConnector } from './connectors'
import { CMS_TYPES } from '../../types/cms'
import type { CMSType, FieldMapping, SyncSchedule } from '../../types/cms'

const IntegrationEditForm = () => {
  const record = useRecordContext()
  const notify = useNotify()

  const [cmsType, setCmsType] = useState<CMSType>(record?.type || 'wordpress')
  const [config, setConfig] = useState<any>(record?.config || {})
  const [mappings, setMappings] = useState<FieldMapping[]>(record?.field_mappings || [])
  const [schedule, setSchedule] = useState<SyncSchedule>(
    record?.sync_schedule || { enabled: true, type: 'manual' }
  )

  useEffect(() => {
    if (record) {
      setCmsType(record.type)
      setConfig(record.config || {})
      setMappings(record.field_mappings || [])
      setSchedule(record.sync_schedule || { enabled: true, type: 'manual' })
    }
  }, [record])

  const connector = getConnector(cmsType)

  const handleSubmit = async (data: any) => {
    try {
      // Transform the data to match the database schema
      const transformedData = {
        ...data,
        config: {
          ...config,
          url: data.url,
          apiKey: data.apiKey
        },
        field_mappings: mappings,
        sync_schedule: schedule
      }

      return transformedData
    } catch (error) {
      notify('Failed to update integration', { type: 'error' })
      throw error
    }
  }

  if (!record) return null

  return (
    <SimpleForm>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Edit CMS Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your CMS connection and sync settings
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="webhook">Webhooks</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <TextInput
                source="name"
                label="Connection Name"
                validate={required()}
                fullWidth
              />

              <SelectInput
                source="type"
                label="CMS Type"
                choices={CMS_TYPES.map(t => ({
                  id: t.id,
                  name: `${t.name} - ${t.description}`
                }))}
                validate={required()}
                onChange={(e: any) => setCmsType(e.target.value as CMSType)}
                fullWidth
                disabled
              />

              <TextInput
                source="config.url"
                label="CMS URL"
                placeholder="https://example.com"
                validate={required()}
                onChange={(e: any) => setConfig({ ...config, url: e.target.value })}
                fullWidth
              />

              <TextInput
                source="config.apiKey"
                label="API Key"
                type="password"
                validate={required()}
                onChange={(e: any) => setConfig({ ...config, apiKey: e.target.value })}
                fullWidth
              />

              {cmsType === 'contentful' && (
                <>
                  <TextInput
                    source="config.spaceId"
                    label="Space ID"
                    onChange={(e: any) => setConfig({ ...config, spaceId: e.target.value })}
                    fullWidth
                  />
                  <TextInput
                    source="config.environment"
                    label="Environment"
                    defaultValue="master"
                    onChange={(e: any) => setConfig({ ...config, environment: e.target.value })}
                    fullWidth
                  />
                </>
              )}

              {cmsType === 'strapi' && (
                <TextInput
                  source="config.collectionType"
                  label="Collection Type"
                  placeholder="articles"
                  onChange={(e: any) => setConfig({ ...config, collectionType: e.target.value })}
                  fullWidth
                />
              )}

              <TextInput
                source="typesense_collection"
                label="Target Typesense Collection"
                validate={required()}
                fullWidth
              />

              <div className="pt-4">
                <ConnectionTest connector={connector} config={config} />
              </div>

              <BooleanInput
                source="is_active"
                label="Active"
              />
            </TabsContent>

            <TabsContent value="mapping" className="mt-4">
              <FieldMapper
                connector={connector}
                config={config}
                mappings={mappings}
                onChange={setMappings}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <SyncScheduler
                schedule={schedule}
                onChange={setSchedule}
              />

              <div className="mt-4">
                <SelectInput
                  source="sync_mode"
                  label="Sync Mode"
                  choices={[
                    { id: 'manual', name: 'Manual' },
                    { id: 'scheduled', name: 'Scheduled' },
                    { id: 'webhook', name: 'Webhook' },
                    { id: 'incremental', name: 'Incremental' }
                  ]}
                  fullWidth
                />
              </div>
            </TabsContent>

            <TabsContent value="webhook" className="mt-4">
              <WebhookSetup
                connector={connector}
                config={config}
                connectionId={record.id}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <SyncHistory integrationId={record.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </SimpleForm>
  )
}

export const IntegrationEdit = () => {
  return (
    <Edit
      mutationMode="pessimistic"
    >
      <IntegrationEditForm />
    </Edit>
  )
}
