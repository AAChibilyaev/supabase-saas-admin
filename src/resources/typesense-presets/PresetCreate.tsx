import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  required,
  BooleanInput,
  TabbedForm,
  FormTab,
  SelectInput
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

const validateName = [required()]

export const PresetCreate = () => (
  <Create redirect="list">
    <TabbedForm>
      <FormTab label="General" sx={{ maxWidth: '50em' }}>
        <Card>
          <CardHeader>
            <CardTitle>Preset Information</CardTitle>
            <CardDescription>
              Basic information about this search preset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextInput
              source="name"
              validate={validateName}
              fullWidth
              helperText="Unique name for this preset"
            />
            <TextInput
              source="description"
              multiline
              rows={3}
              fullWidth
              helperText="Description of what this preset is used for"
            />
          </CardContent>
        </Card>
      </FormTab>

      <FormTab label="Query Configuration">
        <Card>
          <CardHeader>
            <CardTitle>Search Query Settings</CardTitle>
            <CardDescription>
              Configure which fields to search and how to search them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextInput
              source="parameters.q"
              label="Default Query"
              defaultValue="*"
              fullWidth
              helperText="Default search query (use * for wildcard)"
            />
            <TextInput
              source="parameters.query_by"
              label="Query By Fields"
              fullWidth
              helperText="Comma-separated list of fields to search (e.g., title,content,description)"
            />
            <NumberInput
              source="parameters.num_typos"
              label="Number of Typos"
              defaultValue={2}
              min={0}
              max={2}
              helperText="Number of typos to tolerate (0-2)"
            />
            <BooleanInput
              source="parameters.prefix"
              label="Enable Prefix Search"
              defaultValue={true}
              helperText="Allow prefix matching for incomplete words"
            />
            <NumberInput
              source="parameters.drop_tokens_threshold"
              label="Drop Tokens Threshold"
              defaultValue={1}
              min={0}
              helperText="Number of tokens to drop if no results found"
            />
            <NumberInput
              source="parameters.typo_tokens_threshold"
              label="Typo Tokens Threshold"
              defaultValue={1}
              min={0}
              helperText="Minimum number of tokens to apply typo tolerance"
            />
          </CardContent>
        </Card>
      </FormTab>

      <FormTab label="Filters & Facets">
        <Card>
          <CardHeader>
            <CardTitle>Filter Configuration</CardTitle>
            <CardDescription>
              Set up filters and facets for refined search results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextInput
              source="parameters.filter_by"
              label="Filter By"
              multiline
              rows={3}
              fullWidth
              helperText="Filter expression (e.g., status:=published && category:[blog,news])"
            />
            <TextInput
              source="parameters.facet_by"
              label="Facet By Fields"
              fullWidth
              helperText="Comma-separated list of fields for faceting (e.g., category,status,author)"
            />
            <NumberInput
              source="parameters.max_facet_values"
              label="Max Facet Values"
              defaultValue={10}
              min={1}
              max={100}
              helperText="Maximum number of facet values to return per field"
            />
            <TextInput
              source="parameters.include_fields"
              label="Include Fields"
              fullWidth
              helperText="Comma-separated list of fields to include in results (default: all fields)"
            />
            <TextInput
              source="parameters.exclude_fields"
              label="Exclude Fields"
              fullWidth
              helperText="Comma-separated list of fields to exclude from results"
            />
          </CardContent>
        </Card>
      </FormTab>

      <FormTab label="Sorting & Pagination">
        <Card>
          <CardHeader>
            <CardTitle>Sort and Pagination Settings</CardTitle>
            <CardDescription>
              Configure how results are sorted and paginated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextInput
              source="parameters.sort_by"
              label="Sort By"
              fullWidth
              helperText="Sort expression (e.g., _text_match:desc,created_at:desc)"
            />
            <NumberInput
              source="parameters.per_page"
              label="Results Per Page"
              defaultValue={20}
              min={1}
              max={250}
              helperText="Number of results to return per page (1-250)"
            />
            <NumberInput
              source="parameters.page"
              label="Default Page"
              defaultValue={1}
              min={1}
              helperText="Default page number to start from"
            />
            <SelectInput
              source="parameters.prioritize_exact_match"
              label="Prioritize Exact Match"
              choices={[
                { id: 'true', name: 'Yes' },
                { id: 'false', name: 'No' }
              ]}
              defaultValue="true"
              helperText="Prioritize exact matches in results"
            />
            <SelectInput
              source="parameters.exhaustive_search"
              label="Exhaustive Search"
              choices={[
                { id: 'true', name: 'Yes' },
                { id: 'false', name: 'No' }
              ]}
              defaultValue="false"
              helperText="Perform exhaustive search for better accuracy (slower)"
            />
          </CardContent>
        </Card>
      </FormTab>

      <FormTab label="Highlighting">
        <Card>
          <CardHeader>
            <CardTitle>Highlighting Configuration</CardTitle>
            <CardDescription>
              Configure result highlighting for matched terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextInput
              source="parameters.highlight_full_fields"
              label="Highlight Full Fields"
              fullWidth
              helperText="Comma-separated list of fields to highlight fully (default: all query_by fields)"
            />
            <TextInput
              source="parameters.highlight_start_tag"
              label="Highlight Start Tag"
              defaultValue="<mark>"
              helperText="HTML tag to wrap highlighted text (start)"
            />
            <TextInput
              source="parameters.highlight_end_tag"
              label="Highlight End Tag"
              defaultValue="</mark>"
              helperText="HTML tag to wrap highlighted text (end)"
            />
            <NumberInput
              source="parameters.snippet_threshold"
              label="Snippet Threshold"
              defaultValue={30}
              min={1}
              helperText="Number of tokens to include in highlighted snippets"
            />
            <NumberInput
              source="parameters.limit_hits"
              label="Limit Hits"
              min={1}
              helperText="Limit the number of hits returned (for performance)"
            />
          </CardContent>
        </Card>
      </FormTab>

      <FormTab label="Advanced">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Additional configuration options for power users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextInput
              source="parameters.group_by"
              label="Group By Field"
              fullWidth
              helperText="Field to group results by (e.g., category)"
            />
            <NumberInput
              source="parameters.group_limit"
              label="Group Limit"
              min={1}
              helperText="Maximum number of results per group"
            />
            <TextInput
              source="parameters.search_cutoff_ms"
              label="Search Cutoff (ms)"
              helperText="Maximum time to spend on search in milliseconds"
            />
            <BooleanInput
              source="parameters.use_cache"
              label="Use Cache"
              defaultValue={true}
              helperText="Enable caching for faster repeated searches"
            />
            <TextInput
              source="parameters.override_tags"
              label="Override Tags"
              fullWidth
              helperText="Tags to override search behavior (comma-separated)"
            />
            <TextInput
              source="parameters.pinned_hits"
              label="Pinned Hits"
              multiline
              rows={3}
              fullWidth
              helperText="Document IDs to pin at the top of results (comma-separated)"
            />
            <TextInput
              source="parameters.hidden_hits"
              label="Hidden Hits"
              multiline
              rows={3}
              fullWidth
              helperText="Document IDs to hide from results (comma-separated)"
            />
          </CardContent>
        </Card>
      </FormTab>
    </TabbedForm>
  </Create>
)
