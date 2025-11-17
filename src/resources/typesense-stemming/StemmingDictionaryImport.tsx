import { useState } from 'react'
import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  required,
  useCreate,
  useNotify,
  useRedirect
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Upload, FileText, AlertCircle } from 'lucide-react'

const languageChoices = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Russian' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'it', name: 'Italian' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'nl', name: 'Dutch' },
  { id: 'sv', name: 'Swedish' },
  { id: 'no', name: 'Norwegian' },
  { id: 'da', name: 'Danish' },
  { id: 'fi', name: 'Finnish' },
  { id: 'pl', name: 'Polish' },
  { id: 'cs', name: 'Czech' },
  { id: 'hu', name: 'Hungarian' },
  { id: 'ro', name: 'Romanian' },
  { id: 'tr', name: 'Turkish' },
  { id: 'ar', name: 'Arabic' },
  { id: 'zh', name: 'Chinese' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ko', name: 'Korean' }
]

const FileUploadSection = ({ onFileUpload }: { onFileUpload: (data: any) => void }) => {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setFile(selectedFile)

    try {
      const text = await selectedFile.text()
      let parsedData: any

      // Try to parse as JSON
      if (selectedFile.name.endsWith('.json')) {
        parsedData = JSON.parse(text)
      } else if (selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv')) {
        // Parse as line-delimited or CSV format
        // Expected format: "word,stem" or "word→stem" or just "word stem"
        const lines = text.split('\n').filter(line => line.trim())
        parsedData = {}

        lines.forEach(line => {
          const trimmed = line.trim()
          // Support multiple delimiters: comma, arrow, tab, space
          const parts = trimmed.split(/[,→\t]|(?<=\S)\s+(?=\S)/)
          if (parts.length >= 2) {
            const [word, stem] = parts.map(p => p.trim())
            if (word && stem) {
              parsedData[word] = stem
            }
          }
        })
      } else {
        throw new Error('Unsupported file format. Please use .json, .txt, or .csv')
      }

      setPreview(parsedData)
      onFileUpload(parsedData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file'
      setError(message)
      setFile(null)
      setPreview(null)
    }
  }

  const getPreviewText = () => {
    if (!preview) return ''

    if (Array.isArray(preview)) {
      const sample = preview.slice(0, 5)
      return sample.map((rule: any) =>
        typeof rule === 'string' ? rule : `${rule.base || rule.word} → ${rule.stem || rule.variant}`
      ).join('\n')
    } else if (typeof preview === 'object') {
      const entries = Object.entries(preview).slice(0, 5)
      return entries.map(([key, value]) => `${key} → ${value}`).join('\n')
    }

    return ''
  }

  const getWordCount = () => {
    if (!preview) return 0

    if (Array.isArray(preview)) {
      return preview.length
    } else if (typeof preview === 'object') {
      return Object.keys(preview).length
    }

    return 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Stemming Dictionary
        </CardTitle>
        <CardDescription>
          Upload a stemming dictionary file in JSON, TXT, or CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".json,.txt,.csv"
            onChange={handleFileChange}
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: JSON, TXT (word→stem per line), CSV (word,stem per line)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {file && preview && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="ml-auto font-medium">{getWordCount()} rules</span>
            </div>

            <div className="rounded-md border p-3 bg-muted/50">
              <Label className="text-xs text-muted-foreground mb-2 block">Preview (first 5 rules)</Label>
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {getPreviewText()}
              </pre>
            </div>
          </div>
        )}

        <Alert>
          <AlertDescription className="text-xs">
            <strong>File Format Examples:</strong>
            <br />
            <strong>JSON:</strong> {`{"running": "run", "Runner": "run"}`}
            <br />
            <strong>TXT/CSV:</strong> running→run or running,run
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export const StemmingDictionaryImport = () => {
  const [uploadedRules, setUploadedRules] = useState<any>(null)

  return (
    <Create redirect="list">
      <div className="space-y-6">
        <FileUploadSection onFileUpload={setUploadedRules} />

        <SimpleForm
          defaultValues={{
            language: 'en',
            rules: {}
          }}
        >
          <TextInput
            source="id"
            label="Dictionary ID"
            validate={[required()]}
            helperText="Unique identifier for this stemming dictionary"
            fullWidth
          />

          <SelectInput
            source="language"
            label="Language"
            choices={languageChoices}
            validate={[required()]}
            helperText="Primary language for this stemming dictionary"
            fullWidth
          />

          <TextInput
            source="description"
            label="Description"
            multiline
            rows={3}
            helperText="Optional description of this stemming dictionary"
            fullWidth
          />

          {/* Hidden field to store the uploaded rules */}
          <input
            type="hidden"
            name="rules"
            value={JSON.stringify(uploadedRules || {})}
          />

          <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted/50 rounded-md">
            <strong>Stemming Configuration:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Rules will be applied to normalize word variants during search</li>
              <li>Case-insensitive matching is typically applied</li>
              <li>Rules can be used with Typesense collections via stemming configuration</li>
              <li>Test your rules using the dictionary view after import</li>
            </ul>
          </div>
        </SimpleForm>
      </div>
    </Create>
  )
}
