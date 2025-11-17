import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
  required,
  useInput,
  FormDataConsumer
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { InfoIcon } from 'lucide-react'
import { useState } from 'react'

const validateId = [required()]

const SynonymTypeInfo = ({ synonymType }: { synonymType: string }) => {
  const isOneWay = synonymType === 'one-way'

  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        {isOneWay ? (
          <>
            <strong>One-way synonyms (A → B):</strong> When searching for the root term, results will include documents with any of the synonym terms.
            <br />
            <strong>Example:</strong> "blazer" → ["coat", "jacket"] means searching for "blazer" will also find "coat" and "jacket".
          </>
        ) : (
          <>
            <strong>Multi-way synonyms (A ↔ B ↔ C):</strong> All terms are treated as equivalent. Searching for any term will find all others.
            <br />
            <strong>Example:</strong> "blazer" ↔ "coat" ↔ "jacket" means searching for any of these will find all of them.
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
    <ArrayInput source="synonyms" label="Synonym Terms" validate={validateId}>
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
    <ArrayInput source="synonyms" label="Synonym Terms" validate={validateId}>
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

export const SynonymSetCreate = () => {
  return (
    <Create redirect="list">
      <SimpleForm>
        <TextInput
          source="id"
          label="Synonym Set Name"
          helperText="Unique identifier for this synonym set (e.g., 'brand-variations', 'clothing-terms')"
          fullWidth
          validate={validateId}
        />

        <SelectInput
          source="synonymType"
          label="Synonym Type"
          choices={[
            { id: 'multi-way', name: 'Multi-way (A ↔ B ↔ C) - All terms are equivalent' },
            { id: 'one-way', name: 'One-way (A → B) - Root term expands to synonyms' }
          ]}
          defaultValue="multi-way"
          fullWidth
          validate={validateId}
        />

        <FormDataConsumer>
          {({ formData }) => (
            <>
              <SynonymTypeInfo synonymType={formData.synonymType || 'multi-way'} />

              <Card>
                <CardHeader>
                  <CardTitle>Synonym Configuration</CardTitle>
                  <CardDescription>
                    {formData.synonymType === 'one-way'
                      ? 'Configure one-way synonym mapping (A → B)'
                      : 'Configure multi-way synonym mapping (A ↔ B ↔ C)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.synonymType === 'one-way' ? (
                    <OneWaySynonymFields />
                  ) : (
                    <MultiWaySynonymFields />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </FormDataConsumer>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Example Use Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Brand variations:</strong> "iPhone" ↔ "Apple phone" ↔ "iOS device"
              </div>
              <div>
                <strong>Common typos:</strong> "tshirt" ↔ "t-shirt" ↔ "t shirt"
              </div>
              <div>
                <strong>Related terms:</strong> "laptop" ↔ "notebook" ↔ "computer"
              </div>
              <div>
                <strong>One-way expansion:</strong> "sneakers" → ["running shoes", "trainers", "athletic shoes"]
              </div>
            </div>
          </CardContent>
        </Card>
      </SimpleForm>
    </Create>
  )
}
