import React from 'react'

interface SearchHighlightProps {
  text: string
  highlight?: string
  highlightClassName?: string
}

/**
 * Component that highlights search terms in text
 * Supports HTML highlighting tags from Typesense
 */
export const SearchHighlight: React.FC<SearchHighlightProps> = ({
  text,
  highlight,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-900 font-semibold px-0.5 rounded'
}) => {
  if (!highlight || !text) {
    return <span>{text}</span>
  }

  // Check if text already contains HTML highlight tags (from Typesense)
  const hasHTMLTags = text.includes('<mark>') || text.includes('<em>')

  if (hasHTMLTags) {
    // Parse and render HTML highlighting from Typesense
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: text
            .replace(/<mark>/g, `<span class="${highlightClassName}">`)
            .replace(/<\/mark>/g, '</span>')
            .replace(/<em>/g, `<span class="${highlightClassName}">`)
            .replace(/<\/em>/g, '</span>')
        }}
      />
    )
  }

  // Manual highlighting for plain text
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'))

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface HighlightedFieldProps {
  field: string
  snippet?: string
  snippets?: string[]
  value?: string
  query?: string
}

/**
 * Component for rendering highlighted field from Typesense search results
 */
export const HighlightedField: React.FC<HighlightedFieldProps> = ({
  field,
  snippet,
  snippets,
  value,
  query
}) => {
  // Prefer snippet over value
  const content = snippet || (snippets && snippets.length > 0 ? snippets[0] : value)

  if (!content) {
    return <span className="text-gray-400 italic">No content</span>
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {field}
      </div>
      <div className="text-sm">
        <SearchHighlight text={content} highlight={query} />
      </div>
      {snippets && snippets.length > 1 && (
        <div className="space-y-1 mt-2">
          {snippets.slice(1).map((snip, idx) => (
            <div key={idx} className="text-sm text-gray-600 dark:text-gray-300 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
              <SearchHighlight text={snip} highlight={query} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface HighlightStatsProps {
  matchedTokens?: string[]
  textMatch?: number
  textMatchInfo?: {
    best_field_score: string
    best_field_weight: number
    fields_matched: number
    score: string
    tokens_matched: number
  }
}

/**
 * Display text match statistics
 */
export const HighlightStats: React.FC<HighlightStatsProps> = ({
  matchedTokens,
  textMatch,
  textMatchInfo
}) => {
  if (!textMatch && !textMatchInfo && !matchedTokens) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      {textMatch !== undefined && (
        <span className="flex items-center gap-1">
          <span className="font-medium">Score:</span>
          <span className="font-mono">{textMatch.toFixed(2)}</span>
        </span>
      )}
      {textMatchInfo && (
        <>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <span className="font-medium">Fields:</span>
            <span className="font-mono">{textMatchInfo.fields_matched}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <span className="font-medium">Tokens:</span>
            <span className="font-mono">{textMatchInfo.tokens_matched}</span>
          </span>
        </>
      )}
      {matchedTokens && matchedTokens.length > 0 && (
        <>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <span className="font-medium">Matched:</span>
            <span className="font-mono">{matchedTokens.join(', ')}</span>
          </span>
        </>
      )}
    </div>
  )
}
