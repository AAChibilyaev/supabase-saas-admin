import { useState } from 'react'
import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  required,
  useGetIdentity,
  useNotify,
  useRedirect
} from 'react-admin'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { ConnectionTest } from './components/ConnectionTest'
import { FieldMapper } from './components/FieldMapper'
import { SyncScheduler } from './components/SyncScheduler'
import { getConnector } from './connectors'
import { CMS_TYPES } from '../../types/cms'
import type { CMSType, FieldMapping, SyncSchedule } from '../../types/cms'

export const IntegrationCreate = () => {
  const { identity } = useGetIdentity()
  const notify = useNotify()
  const redirect = useRedirect()

  const [cmsType, setCmsType] = useState<CMSType>('wordpress')
  const [config, setConfig] = useState<any>({})
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [schedule, setSchedule] = useState<SyncSchedule>({
    enabled: true,
    type: 'manual'
  })

  const connector = getConnector(cmsType)

  const handleSubmit = async (data: any) => {
    try {
      // Transform the data to match the database schema
      const transformedData = {
        ...data,
        user_id: identity?.id,
        config: {
          url: data.url,
          apiKey: data.apiKey,
          ...config
        },
        field_mappings: mappings,
        sync_schedule: schedule,
        is_active: data.is_active ?? true
      }

      // Return transformed data to be saved by React Admin
      return transformedData
    } catch (error) {
      notify('Failed to create integration', { type: 'error' })
      throw error
    }
  }

  return (
    <Create
      transform={handleSubmit}
      redirect="list"
    >
      <SimpleForm>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create CMS Integration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Connect your CMS to automatically sync content
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="connection" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
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
                  defaultValue="wordpress"
                  fullWidth
                />

                <TextInput
                  source="url"
                  label="CMS URL"
                  placeholder="https://example.com"
                  validate={required()}
                  onChange={(e: any) => setConfig({ ...config, url: e.target.value })}
                  fullWidth
                />

                <TextInput
                  source="apiKey"
                  label="API Key"
                  type="password"
                  validate={required()}
                  onChange={(e: any) => setConfig({ ...config, apiKey: e.target.value })}
                  fullWidth
                />

                {cmsType === 'contentful' && (
                  <>
                    <TextInput
                      source="spaceId"
                      label="Space ID"
                      onChange={(e: any) => setConfig({ ...config, spaceId: e.target.value })}
                      fullWidth
                    />
                    <TextInput
                      source="environment"
                      label="Environment"
                      defaultValue="master"
                      onChange={(e: any) => setConfig({ ...config, environment: e.target.value })}
                      fullWidth
                    />
                  </>
                )}

                {cmsType === 'strapi' && (
                  <TextInput
                    source="collectionType"
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
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <SelectInput
                  source="sync_mode"
                  label="Sync Mode"
                  choices={[
                    { id: 'manual', name: 'Manual' },
                    { id: 'scheduled', name: 'Scheduled' },
                    { id: 'webhook', name: 'Webhook' },
                    { id: 'incremental', name: 'Incremental' }
                  ]}
                  defaultValue="manual"
                  fullWidth
                />

                <BooleanInput
                  source="is_active"
                  label="Active"
                  defaultValue={true}
                />

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-2">Configuration Summary</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>CMS Type: {CMS_TYPES.find(t => t.id === cmsType)?.name}</li>
                    <li>Field Mappings: {mappings.length} configured</li>
                    <li>Sync Schedule: {schedule.type}</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </SimpleForm>
    </Create>
  )
}
