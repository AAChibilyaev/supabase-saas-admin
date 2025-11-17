import { useState } from 'react'
import {
  Show,
  SimpleShowLayout,
  TextField,
  FunctionField,
  TopToolbar,
  EditButton,
  DeleteButton,
  useRecordContext,
  usePermissions
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Search, FileText, Languages, TestTube, CheckCircle2, XCircle } from 'lucide-react'
import { PermissionGate } from '../../components/permissions'
import type { UserPermissions } from '../../types/permissions'

const StemmingDictionaryShowActions = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <TopToolbar>
      {permissions?.canAccess('typesense-stemming', 'delete') && (
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle="Delete Stemming Dictionary"
          confirmContent="Are you sure you want to delete this stemming dictionary?"
        />
      )}
    </TopToolbar>
  )
}

const LanguageField = ({ record }: { record?: any }) => {
  if (!record || !record.language) return <span>-</span>

  const languageNames: Record<string, string> = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'tr': 'Turkish',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean'
  }

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4" />
      <Badge variant="outline">{languageNames[record.language] || record.language}</Badge>
    </div>
  )
}

const StemmingRulesTable = () => {
  const record = useRecordContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  if (!record || !record.rules) {
    return <div className="text-sm text-muted-foreground">No stemming rules found</div>
  }

  let rulesArray: Array<{ word: string; stem: string }> = []

  if (Array.isArray(record.rules)) {
    rulesArray = record.rules.map((rule: any) => {
      if (typeof rule === 'string') {
        return { word: rule, stem: rule }
      } else if (typeof rule === 'object') {
        return {
          word: rule.base || rule.word || '',
          stem: rule.stem || rule.variant || ''
        }
      }
      return { word: '', stem: '' }
    }).filter(r => r.word && r.stem)
  } else if (typeof record.rules === 'object') {
    rulesArray = Object.entries(record.rules).map(([word, stem]) => ({
      word,
      stem: String(stem)
    }))
  }

  // Filter rules based on search term
  const filteredRules = searchTerm
    ? rulesArray.filter(rule =>
        rule.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.stem.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rulesArray

  // Pagination
  const totalPages = Math.ceil(filteredRules.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRules = filteredRules.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Stemming Rules
        </CardTitle>
        <CardDescription>
          {filteredRules.length} rules {searchTerm && `(filtered from ${rulesArray.length})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Word / Variant</th>
                    <th className="text-center p-3 font-medium w-16"></th>
                    <th className="text-left p-3 font-medium">Stem / Base Form</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRules.map((rule, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">{rule.word}</td>
                      <td className="p-3 text-center text-muted-foreground">→</td>
                      <td className="p-3 font-mono text-xs font-semibold">{rule.stem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const StemmingTester = () => {
  const record = useRecordContext()
  const [testWord, setTestWord] = useState('')
  const [result, setResult] = useState<{ found: boolean; stem?: string } | null>(null)

  if (!record || !record.rules) {
    return null
  }

  const testStemming = () => {
    if (!testWord) {
      setResult(null)
      return
    }

    let rulesMap: Record<string, string> = {}

    if (Array.isArray(record.rules)) {
      record.rules.forEach((rule: any) => {
        if (typeof rule === 'object' && (rule.base || rule.word) && (rule.stem || rule.variant)) {
          rulesMap[rule.base || rule.word] = rule.stem || rule.variant
        }
      })
    } else if (typeof record.rules === 'object') {
      rulesMap = record.rules
    }

    // Test with exact match (case-insensitive)
    const lowerTestWord = testWord.toLowerCase()
    const exactMatch = Object.keys(rulesMap).find(
      key => key.toLowerCase() === lowerTestWord
    )

    if (exactMatch) {
      setResult({
        found: true,
        stem: rulesMap[exactMatch]
      })
    } else {
      setResult({
        found: false
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Stemming
        </CardTitle>
        <CardDescription>
          Test how words are stemmed using this dictionary
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="test-word">Enter a word to test</Label>
              <Input
                id="test-word"
                placeholder="e.g., running, searches, better"
                value={testWord}
                onChange={(e) => setTestWord(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    testStemming()
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={testStemming}>Test</Button>
            </div>
          </div>

          {result && (
            <Alert variant={result.found ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {result.found ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5" />
                )}
                <AlertDescription>
                  {result.found ? (
                    <div className="space-y-1">
                      <div className="font-semibold">Match found!</div>
                      <div className="font-mono text-sm">
                        <span className="text-muted-foreground">{testWord}</span>
                        <span className="mx-2">→</span>
                        <span className="font-bold">{result.stem}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">No match found</div>
                      <div className="text-sm">
                        The word "{testWord}" is not in this stemming dictionary
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Alert>
            <AlertDescription className="text-xs">
              <strong>Note:</strong> This tester performs exact dictionary lookups.
              In actual Typesense search, stemming may use additional algorithmic rules
              based on the language configuration.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}

export const StemmingDictionaryView = () => {
  return (
    <Show actions={<StemmingDictionaryShowActions />}>
      <SimpleShowLayout>
        <TextField source="id" label="Dictionary ID" />
        <FunctionField
          label="Language"
          render={(record: any) => <LanguageField record={record} />}
        />
        <TextField source="description" label="Description" />
        <FunctionField
          label="Total Rules"
          render={(record: any) => {
            if (!record || !record.rules) return <span>0</span>

            const count = Array.isArray(record.rules)
              ? record.rules.length
              : typeof record.rules === 'object'
                ? Object.keys(record.rules).length
                : 0

            return (
              <Badge variant="secondary" className="text-base">
                {count} rules
              </Badge>
            )
          }}
        />

        <div className="mt-6 space-y-6">
          <StemmingTester />
          <StemmingRulesTable />
        </div>
      </SimpleShowLayout>
    </Show>
  )
}
