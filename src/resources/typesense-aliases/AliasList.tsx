import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotify, CreateButton, Button as RAButton } from 'react-admin'
import { Badge } from '../../components/ui/badge'
import { Database, Link as LinkIcon } from 'lucide-react'
import { typesenseClient } from '../../providers/typesenseClient'
import type { CollectionAlias } from '../../types/typesense'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

export const AliasList = () => {
  const [aliases, setAliases] = useState<CollectionAlias[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotify()
  const navigate = useNavigate()

  useEffect(() => {
    loadAliases()
  }, [])

  const loadAliases = async () => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await typesenseClient.aliases().retrieve()
      setAliases(response.aliases || [])
    } catch (error: any) {
      notify(`Failed to load aliases: ${error.message}`, { type: 'error' })
      console.error('Error loading aliases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (aliasName: string) => {
    if (!typesenseClient) {
      notify('Typesense client not configured', { type: 'error' })
      return
    }

    if (!window.confirm(`Are you sure you want to delete alias "${aliasName}"?`)) {
      return
    }

    try {
      await typesenseClient.aliases(aliasName).delete()
      notify(`Alias "${aliasName}" deleted successfully`, { type: 'success' })
      loadAliases()
    } catch (error: any) {
      notify(`Failed to delete alias: ${error.message}`, { type: 'error' })
      console.error('Error deleting alias:', error)
    }
  }

  if (!typesenseClient) {
    return (
      <div className="p-8 text-center">
        <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Typesense Not Configured</h2>
        <p className="text-gray-600">
          Please configure Typesense environment variables to use this feature.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading aliases...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Collection Aliases</h1>
          <p className="text-gray-600 mt-1">
            Manage aliases for zero-downtime schema migrations and A/B testing
          </p>
        </div>
        <div className="flex gap-2">
          <RAButton label="Refresh" onClick={loadAliases} />
          <CreateButton />
        </div>
      </div>

      {aliases.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Aliases</h3>
          <p className="text-gray-600 mb-4">
            Create your first alias to point to a collection for seamless migrations.
          </p>
          <CreateButton />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias Name</TableHead>
                <TableHead>Collection Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aliases.map((alias) => (
                <TableRow key={alias.name}>
                  <TableCell className="font-mono font-semibold">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      {alias.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{alias.collection_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <RAButton
                        label="Edit"
                        onClick={() => {
                          navigate(`/typesense-aliases/${alias.name}`)
                        }}
                        size="small"
                      />
                      <RAButton
                        label="Delete"
                        onClick={() => handleDelete(alias.name)}
                        color="error"
                        size="small"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">What are Collection Aliases?</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Enable zero-downtime schema migrations</li>
          <li>• Point an alias to different collection versions</li>
          <li>• A/B test different collection configurations</li>
          <li>• Use aliases in your application instead of collection names</li>
        </ul>
        <div className="mt-3 text-sm text-gray-600">
          <strong>Example Flow:</strong> Create products_v2 → Test it → Update
          "products" alias → Delete products_v1
        </div>
      </div>
    </div>
  )
}
