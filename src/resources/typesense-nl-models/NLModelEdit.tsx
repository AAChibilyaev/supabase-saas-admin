import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  required,
  BooleanInput,
  TabbedForm,
  FormTab,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
  usePermissions
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import type { UserPermissions } from '../../types/permissions'

const validateModelName = [required()]
const validateModelType = [required()]

export const NLModelEdit = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <Edit>
      <TabbedForm>
        <FormTab label="General" sx={{ maxWidth: '50em' }}>
          <Card>
            <CardHeader>
              <CardTitle>NL Search Model Information</CardTitle>
              <CardDescription>
                Basic information about this natural language search model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="model_name"
                validate={validateModelName}
                fullWidth
                helperText="Unique name for this NL search model"
              />
              <TextInput
                source="description"
                multiline
                rows={3}
                fullWidth
                helperText="Description of what this model is used for"
              />
              <SelectInput
                source="model_type"
                validate={validateModelType}
                choices={[
                  { id: 'embedding', name: 'Embedding Model' },
                  { id: 'semantic', name: 'Semantic Search' },
                  { id: 'conversational', name: 'Conversational Search' }
                ]}
                fullWidth
                helperText="Type of natural language search model"
              />
              <SelectInput
                source="status"
                choices={[
                  { id: 'active', name: 'Active' },
                  { id: 'training', name: 'Training' },
                  { id: 'inactive', name: 'Inactive' },
                  { id: 'error', name: 'Error' }
                ]}
                fullWidth
                helperText="Current status of the model"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Model Configuration">
          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>
                Configure the model architecture and parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="base_model"
                label="Base Model"
                fullWidth
                helperText="Base model or provider (e.g., openai/text-embedding-3-small, sentence-transformers/all-MiniLM-L6-v2)"
              />
              <NumberInput
                source="embedding_dimensions"
                label="Embedding Dimensions"
                min={128}
                max={4096}
                helperText="Dimensions of the embedding vectors (128-4096)"
              />
              <TextInput
                source="model_provider"
                label="Model Provider"
                fullWidth
                helperText="Provider hosting the model (e.g., openai, huggingface, local)"
              />
              <TextInput
                source="api_endpoint"
                label="API Endpoint"
                fullWidth
                helperText="Custom API endpoint if using external service"
              />
              <TextInput
                source="api_key"
                label="API Key"
                type="password"
                fullWidth
                helperText="API key for external model provider (if required)"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Embedding Settings">
          <Card>
            <CardHeader>
              <CardTitle>Vector Embedding Configuration</CardTitle>
              <CardDescription>
                Configure how text is converted to vector embeddings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="embedding_field"
                label="Embedding Field"
                fullWidth
                helperText="Field name to store embeddings in documents"
              />
              <NumberInput
                source="max_sequence_length"
                label="Max Sequence Length"
                min={128}
                max={8192}
                helperText="Maximum token sequence length for input text"
              />
              <SelectInput
                source="pooling_strategy"
                label="Pooling Strategy"
                choices={[
                  { id: 'mean', name: 'Mean Pooling' },
                  { id: 'cls', name: 'CLS Token' },
                  { id: 'max', name: 'Max Pooling' }
                ]}
                fullWidth
                helperText="Strategy for pooling token embeddings"
              />
              <BooleanInput
                source="normalize_embeddings"
                label="Normalize Embeddings"
                helperText="Normalize vectors to unit length"
              />
              <NumberInput
                source="batch_size"
                label="Batch Size"
                min={1}
                max={256}
                helperText="Batch size for embedding generation"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Search Configuration">
          <Card>
            <CardHeader>
              <CardTitle>Semantic Search Settings</CardTitle>
              <CardDescription>
                Configure semantic search behavior and ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelectInput
                source="similarity_metric"
                label="Similarity Metric"
                choices={[
                  { id: 'cosine', name: 'Cosine Similarity' },
                  { id: 'euclidean', name: 'Euclidean Distance' },
                  { id: 'dot_product', name: 'Dot Product' }
                ]}
                fullWidth
                helperText="Metric for measuring vector similarity"
              />
              <NumberInput
                source="similarity_threshold"
                label="Similarity Threshold"
                min={0}
                max={1}
                step={0.05}
                helperText="Minimum similarity score for results (0-1)"
              />
              <NumberInput
                source="max_results"
                label="Max Results"
                min={1}
                max={1000}
                helperText="Maximum number of results to return"
              />
              <BooleanInput
                source="hybrid_search"
                label="Enable Hybrid Search"
                helperText="Combine semantic and keyword search"
              />
              <NumberInput
                source="hybrid_weight"
                label="Hybrid Weight (Semantic)"
                min={0}
                max={1}
                step={0.1}
                helperText="Weight for semantic search in hybrid mode (0=keyword only, 1=semantic only)"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Training & Fine-tuning">
          <Card>
            <CardHeader>
              <CardTitle>Model Training Configuration</CardTitle>
              <CardDescription>
                Configure training and fine-tuning parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BooleanInput
                source="enable_training"
                label="Enable Training"
                helperText="Allow model fine-tuning on your data"
              />
              <TextInput
                source="training_dataset"
                label="Training Dataset"
                fullWidth
                helperText="Path or ID of training dataset"
              />
              <NumberInput
                source="training_epochs"
                label="Training Epochs"
                min={1}
                max={100}
                helperText="Number of training epochs"
              />
              <NumberInput
                source="learning_rate"
                label="Learning Rate"
                min={0.00001}
                max={0.01}
                step={0.00001}
                helperText="Learning rate for training"
              />
              <BooleanInput
                source="auto_retrain"
                label="Auto Retrain"
                helperText="Automatically retrain on new data"
              />
              <TextInput
                source="retrain_schedule"
                label="Retrain Schedule"
                fullWidth
                helperText="Cron schedule for automatic retraining (e.g., 0 0 * * 0 for weekly)"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Test Queries">
          <Card>
            <CardHeader>
              <CardTitle>Test Query Configuration</CardTitle>
              <CardDescription>
                Define test queries to evaluate model performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArrayInput source="test_queries" label="Test Queries">
                <SimpleFormIterator inline>
                  <TextInput
                    source="query"
                    label="Query Text"
                    fullWidth
                    helperText="Test query to evaluate"
                  />
                  <TextInput
                    source="expected_result"
                    label="Expected Result ID"
                    helperText="Expected document ID in results"
                  />
                </SimpleFormIterator>
              </ArrayInput>
              <NumberInput
                source="test_threshold"
                label="Test Score Threshold"
                min={0}
                max={1}
                step={0.05}
                helperText="Minimum score to pass test queries"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Additional configuration options for advanced users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="preprocessing_steps"
                label="Preprocessing Steps"
                multiline
                rows={3}
                fullWidth
                helperText="JSON array of preprocessing steps (e.g., ['lowercase', 'remove_stopwords'])"
              />
              <BooleanInput
                source="enable_caching"
                label="Enable Embedding Cache"
                helperText="Cache embeddings for faster repeated queries"
              />
              <NumberInput
                source="cache_ttl"
                label="Cache TTL (seconds)"
                min={60}
                max={86400}
                helperText="Time to live for cached embeddings"
              />
              <TextInput
                source="custom_config"
                label="Custom Configuration"
                multiline
                rows={5}
                fullWidth
                helperText="Custom JSON configuration for advanced settings"
              />
              <ArrayInput source="tags" label="Tags">
                <SimpleFormIterator inline>
                  <TextInput source="" label="Tag" />
                </SimpleFormIterator>
              </ArrayInput>
            </CardContent>
          </Card>
        </FormTab>
      </TabbedForm>
    </Edit>
  )
}
