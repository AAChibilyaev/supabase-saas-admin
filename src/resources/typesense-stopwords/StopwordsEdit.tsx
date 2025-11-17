import { useState } from 'react'
import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  required,
  useRecordContext,
  useNotify,
  useRefresh
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { X, Plus, FileText } from 'lucide-react'

const validateId = [required()]

// Predefined stopwords lists for common languages
const PREDEFINED_STOPWORDS: Record<string, string[]> = {
  en: [
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
    'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or',
    'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they',
    'this', 'to', 'was', 'will', 'with'
  ],
  ru: [
    'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со',
    'как', 'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты',
    'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне'
  ],
  es: [
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se',
    'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le',
    'lo', 'todo', 'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir'
  ],
  fr: [
    'le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je',
    'son', 'que', 'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au',
    'pour', 'pas', 'que', 'vous', 'par', 'sur', 'faire', 'plus', 'dire', 'me'
  ],
  de: [
    'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich',
    'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als',
    'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach'
  ]
}

const StopwordsManager = () => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [newWord, setNewWord] = useState('')
  const [stopwords, setStopwords] = useState<string[]>(record?.stopwords || [])

  // Handle adding a new stopword
  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase()
    if (!word) {
      notify('Please enter a word', { type: 'warning' })
      return
    }

    if (stopwords.includes(word)) {
      notify('Word already exists in the list', { type: 'warning' })
      return
    }

    const updatedWords = [...stopwords, word].sort()
    setStopwords(updatedWords)
    setNewWord('')
    notify('Word added successfully', { type: 'success' })
  }

  // Handle removing a stopword
  const handleRemoveWord = (word: string) => {
    const updatedWords = stopwords.filter(w => w !== word)
    setStopwords(updatedWords)
    notify('Word removed', { type: 'info' })
  }

  // Handle importing predefined list
  const handleImportPredefined = () => {
    const locale = record?.locale || 'en'
    const predefinedList = PREDEFINED_STOPWORDS[locale]

    if (!predefinedList) {
      notify(`No predefined list available for locale: ${locale}`, { type: 'warning' })
      return
    }

    // Merge with existing words and remove duplicates
    const mergedWords = [...new Set([...stopwords, ...predefinedList])].sort()
    setStopwords(mergedWords)
    notify(`Imported ${predefinedList.length} predefined stopwords`, { type: 'success' })
  }

  // Update the record when stopwords change
  if (record && record.stopwords !== stopwords) {
    record.stopwords = stopwords
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Manage Stopwords</CardTitle>
          <CardDescription>
            Add or remove stopwords from this set. Total: {stopwords.length} words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new word */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter a stopword"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddWord()
                }
              }}
            />
            <Button onClick={handleAddWord} type="button">
              <Plus className="h-4 w-4 mr-2" />
              Add Word
            </Button>
          </div>

          {/* Import predefined list */}
          <div>
            <Button
              onClick={handleImportPredefined}
              variant="outline"
              type="button"
            >
              <FileText className="h-4 w-4 mr-2" />
              Import Predefined List ({record?.locale || 'en'})
            </Button>
          </div>

          {/* Stopwords list */}
          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {stopwords.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No stopwords yet. Add words above or import a predefined list.
                </p>
              ) : (
                stopwords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    {word}
                    <button
                      onClick={() => handleRemoveWord(word)}
                      className="ml-2 hover:opacity-70"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const StopwordsEdit = () => {
  return (
    <Edit mutationMode="pessimistic">
      <SimpleForm>
        <TextInput source="id" validate={validateId} disabled fullWidth />
        <SelectInput
          source="locale"
          label="Locale"
          choices={[
            { id: 'en', name: 'English' },
            { id: 'ru', name: 'Russian' },
            { id: 'es', name: 'Spanish' },
            { id: 'fr', name: 'French' },
            { id: 'de', name: 'German' },
            { id: 'it', name: 'Italian' },
            { id: 'pt', name: 'Portuguese' },
            { id: 'zh', name: 'Chinese' },
            { id: 'ja', name: 'Japanese' },
            { id: 'ko', name: 'Korean' }
          ]}
          fullWidth
        />
        <StopwordsManager />
      </SimpleForm>
    </Edit>
  )
}
