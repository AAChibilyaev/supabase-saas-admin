import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
  required,
  useRecordContext,
  SaveButton,
  Toolbar,
  DeleteButton,
  usePermissions
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { InfoIcon } from 'lucide-react'
import type { UserPermissions } from '../../types/permissions'

const validateId = [required()]

const SynonymEditToolbar = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <Toolbar>
      <SaveButton />
      {permissions?.canAccess('typesense-synonyms', 'delete') && (
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle="Delete Synonym Set"
          confirmContent="Are you sure you want to delete this synonym set? This action cannot be undone."
        />
      )}
    </Toolbar>
  )
}

const SynonymTypeInfo = () => {
  const record = useRecordContext()

  if (!record) return null

  const isOneWay = !!record.root

  return (
    <Alert>
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        {isOneWay ? (
          <>
            <strong>One-way synonyms:</strong> When searching for the root term, results will include documents with any of the synonym terms.
            For example: "blazer" → ["coat", "jacket"] means searching for "blazer" will also find "coat" and "jacket".
          </>
        ) : (
          <>
            <strong>Multi-way synonyms:</strong> All terms are treated as equivalent.
            For example: "blazer" ↔ "coat" ↔ "jacket" means searching for any of these will find all of them.
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}

const OneWaySynonymFields = () => (
  <>
    <TextInput
      source="root"
      label="Root Term"
      helperText="The search term that will trigger the synonyms"
      fullWidth
      validate={validateId}
    />
    <ArrayInput source="synonyms" label="Synonym Terms">
      <SimpleFormIterator inline>
        <TextInput
          source=""
          label="Synonym"
          helperText="Terms that will be included when searching for the root term"
        />
      </SimpleFormIterator>
    </ArrayInput>
  </>
)

const MultiWaySynonymFields = () => (
  <>
    <ArrayInput source="synonyms" label="Synonym Terms">
      <SimpleFormIterator inline>
        <TextInput
          source=""
          label="Synonym"
          helperText="All terms will be treated as equivalent"
        />
      </SimpleFormIterator>
    </ArrayInput>
  </>
)

const SynonymFields = () => {
  const record = useRecordContext()

  if (!record) return null

  const isOneWay = !!record.root

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Synonym Configuration</CardTitle>
        <CardDescription>
          {isOneWay ? 'One-way synonym mapping (A → B)' : 'Multi-way synonym mapping (A ↔ B ↔ C)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SynonymTypeInfo />
        <div className="mt-4">
          {isOneWay ? <OneWaySynonymFields /> : <MultiWaySynonymFields />}
        </div>
      </CardContent>
    </Card>
  )
}

export const SynonymSetEdit = () => {
  return (
    <Edit>
      <SimpleForm toolbar={<SynonymEditToolbar />}>
        <TextInput
          source="id"
          label="Synonym Set Name"
          helperText="Unique identifier for this synonym set"
          fullWidth
          disabled
        />
        <SynonymFields />
      </SimpleForm>
    </Edit>
  )
}
