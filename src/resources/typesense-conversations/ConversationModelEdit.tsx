import {
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  required,
  usePermissions,
  BooleanInput,
  TabbedForm,
  FormTab,
  SelectInput
} from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import type { UserPermissions } from '../../types/permissions'

const validateModelName = [required()]

export const ConversationModelEdit = () => {
  const { permissions } = usePermissions<UserPermissions>()

  return (
    <Edit>
      <TabbedForm>
        <FormTab label="General" sx={{ maxWidth: '50em' }}>
          <Card>
            <CardHeader>
              <CardTitle>Conversation Model Information</CardTitle>
              <CardDescription>
                Basic information about this conversation model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="model_name"
                validate={validateModelName}
                fullWidth
                helperText="Unique name for this conversation model"
              />
              <BooleanInput
                source="enabled"
                label="Enable Model"
                helperText="Enable or disable this conversation model"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="LLM Configuration">
          <Card>
            <CardHeader>
              <CardTitle>Large Language Model Settings</CardTitle>
              <CardDescription>
                Configure the LLM provider and model parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelectInput
                source="llm_model.model_name"
                label="Model Name"
                choices={[
                  { id: 'openai/gpt-4-turbo-preview', name: 'OpenAI GPT-4 Turbo' },
                  { id: 'openai/gpt-4', name: 'OpenAI GPT-4' },
                  { id: 'openai/gpt-3.5-turbo', name: 'OpenAI GPT-3.5 Turbo' },
                  { id: 'anthropic/claude-3-opus-20240229', name: 'Anthropic Claude 3 Opus' },
                  { id: 'anthropic/claude-3-sonnet-20240229', name: 'Anthropic Claude 3 Sonnet' },
                  { id: 'anthropic/claude-3-haiku-20240307', name: 'Anthropic Claude 3 Haiku' },
                  { id: 'google/gemini-pro', name: 'Google Gemini Pro' },
                  { id: 'cohere/command', name: 'Cohere Command' },
                ]}
                fullWidth
                helperText="Select the LLM model to use for conversations"
              />
              <TextInput
                source="llm_model.api_key"
                label="API Key"
                type="password"
                fullWidth
                helperText="API key for the LLM provider (leave empty to keep existing key)"
              />
              <NumberInput
                source="llm_model.temperature"
                label="Temperature"
                min={0}
                max={2}
                step={0.1}
                fullWidth
                helperText="Controls randomness. Lower is more focused, higher is more creative (0-2)"
              />
              <NumberInput
                source="llm_model.max_tokens"
                label="Max Tokens"
                min={1}
                max={32000}
                fullWidth
                helperText="Maximum number of tokens to generate in the response"
              />
              <NumberInput
                source="llm_model.top_p"
                label="Top P"
                min={0}
                max={1}
                step={0.1}
                fullWidth
                helperText="Nucleus sampling parameter (0-1)"
              />
              <NumberInput
                source="llm_model.frequency_penalty"
                label="Frequency Penalty"
                min={-2}
                max={2}
                step={0.1}
                fullWidth
                helperText="Penalty for repeating tokens (-2 to 2)"
              />
              <NumberInput
                source="llm_model.presence_penalty"
                label="Presence Penalty"
                min={-2}
                max={2}
                step={0.1}
                fullWidth
                helperText="Penalty for using tokens already present (-2 to 2)"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Retrieval Configuration">
          <Card>
            <CardHeader>
              <CardTitle>RAG Retrieval Settings</CardTitle>
              <CardDescription>
                Configure how documents are retrieved and used in conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="conversation_config.collection"
                label="Collection Name"
                fullWidth
                helperText="Typesense collection to search for context"
              />
              <TextInput
                source="conversation_config.search_fields"
                label="Search Fields"
                fullWidth
                helperText="Comma-separated list of fields to search (e.g., title,content,description)"
              />
              <NumberInput
                source="conversation_config.top_k"
                label="Top K Results"
                min={1}
                max={20}
                fullWidth
                helperText="Number of top results to retrieve as context (1-20)"
              />
              <NumberInput
                source="conversation_config.min_score"
                label="Minimum Score"
                min={0}
                max={1}
                step={0.1}
                fullWidth
                helperText="Minimum relevance score for retrieved documents (0-1)"
              />
              <TextInput
                source="conversation_config.filter_by"
                label="Filter By"
                multiline
                rows={3}
                fullWidth
                helperText="Optional filter expression (e.g., status:=published && category:[blog,news])"
              />
              <BooleanInput
                source="conversation_config.include_embedding_distance"
                label="Include Embedding Distance"
                helperText="Include embedding distance scores in retrieval results"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Prompt Templates">
          <Card>
            <CardHeader>
              <CardTitle>System and User Prompts</CardTitle>
              <CardDescription>
                Configure the prompt templates for the conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextInput
                source="conversation_config.system_prompt"
                label="System Prompt"
                multiline
                rows={6}
                fullWidth
                helperText="System prompt that sets the behavior of the AI assistant"
              />
              <TextInput
                source="conversation_config.context_template"
                label="Context Template"
                multiline
                rows={4}
                fullWidth
                helperText="Template for formatting retrieved context. Use {context} and {query} placeholders"
              />
              <TextInput
                source="conversation_config.no_context_template"
                label="No Context Template"
                multiline
                rows={4}
                fullWidth
                helperText="Template when no relevant context is found. Use {query} placeholder"
              />
            </CardContent>
          </Card>
        </FormTab>

        <FormTab label="Advanced Settings">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>
                Additional settings for fine-tuning conversation behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NumberInput
                source="conversation_config.conversation_history_limit"
                label="Conversation History Limit"
                min={0}
                max={50}
                fullWidth
                helperText="Number of previous messages to include in context (0-50)"
              />
              <NumberInput
                source="conversation_config.max_context_length"
                label="Max Context Length"
                min={100}
                max={32000}
                fullWidth
                helperText="Maximum number of characters for retrieved context"
              />
              <BooleanInput
                source="conversation_config.stream_response"
                label="Stream Response"
                helperText="Stream the LLM response in real-time"
              />
              <BooleanInput
                source="conversation_config.include_sources"
                label="Include Sources"
                helperText="Include source documents in the response"
              />
              <BooleanInput
                source="conversation_config.deduplicate_context"
                label="Deduplicate Context"
                helperText="Remove duplicate content from retrieved context"
              />
              <TextInput
                source="conversation_config.fallback_message"
                label="Fallback Message"
                multiline
                rows={3}
                fullWidth
                helperText="Message to display when no relevant context is found and general knowledge is disabled"
              />
            </CardContent>
          </Card>
        </FormTab>
      </TabbedForm>
    </Edit>
  )
}
