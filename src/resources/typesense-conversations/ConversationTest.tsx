import { useState } from 'react'
import { useGetOne } from 'react-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Send, Loader2, MessageSquare, FileText } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: any[]
}

export const ConversationTest = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)

  // This would be used to load the model details
  const { data: model, isLoading: isLoadingModel } = useGetOne(
    'typesense-conversations',
    { id: selectedModelId || '' },
    { enabled: !!selectedModelId }
  )

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // TODO: Implement actual API call to Typesense conversation endpoint
      // For now, this is a placeholder that simulates a response

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'This is a placeholder response. The actual implementation would call the Typesense conversation API with RAG retrieval.',
        timestamp: new Date(),
        sources: [
          {
            id: 'doc-1',
            title: 'Example Document 1',
            content: 'Sample content...',
            score: 0.95
          },
          {
            id: 'doc-2',
            title: 'Example Document 2',
            content: 'Sample content...',
            score: 0.87
          }
        ]
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearConversation = () => {
    setMessages([])
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <CardHeader>
          <CardTitle>Test Conversation Model</CardTitle>
          <CardDescription>
            Test your RAG conversation model with an interactive chat interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Model Info */}
          {model && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <strong>Model:</strong>
                <Badge variant="default">{model.model_name}</Badge>
                <strong>LLM:</strong>
                <Badge variant="secondary">{model.llm_model?.model_name}</Badge>
                <strong>Collection:</strong>
                <Badge variant="outline">{model.conversation_config?.collection}</Badge>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div
            style={{
              height: '500px',
              overflowY: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              backgroundColor: '#fafafa'
            }}
          >
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#999'
              }}>
                <MessageSquare size={48} style={{ marginBottom: '10px' }} />
                <p>Start a conversation by typing a message below</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: message.role === 'user' ? '#007bff' : '#ffffff',
                      color: message.role === 'user' ? '#ffffff' : '#000000',
                      border: message.role === 'assistant' ? '1px solid #e0e0e0' : 'none',
                      boxShadow: message.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <div style={{ marginBottom: '5px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      textAlign: message.role === 'user' ? 'right' : 'left'
                    }}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Display sources for assistant messages */}
                  {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div style={{
                      marginTop: '10px',
                      maxWidth: '70%',
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '8px',
                        fontWeight: 'bold'
                      }}>
                        <FileText size={14} />
                        Sources ({message.sources.length})
                      </div>
                      {message.sources.map((source, idx) => (
                        <div key={idx} style={{
                          marginBottom: '5px',
                          paddingBottom: '5px',
                          borderBottom: idx < message.sources!.length - 1 ? '1px solid #ddd' : 'none'
                        }}>
                          <div style={{ fontWeight: '500' }}>{source.title}</div>
                          <div style={{ opacity: 0.7 }}>Score: {source.score.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#666'
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                resize: 'vertical',
                minHeight: '60px',
                maxHeight: '200px',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
              disabled={isLoading}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                style={{ height: '60px', minWidth: '60px' }}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
              <Button
                onClick={clearConversation}
                variant="outline"
                disabled={messages.length === 0}
                style={{ height: 'auto', fontSize: '12px' }}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            display: 'flex',
            gap: '20px',
            fontSize: '13px'
          }}>
            <div>
              <strong>Messages:</strong> {messages.length}
            </div>
            <div>
              <strong>User:</strong> {messages.filter(m => m.role === 'user').length}
            </div>
            <div>
              <strong>Assistant:</strong> {messages.filter(m => m.role === 'assistant').length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
