import { useState } from 'react'
import { Grid } from '@mui/material'
import { Copy, Check, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Badge } from '../../../components/ui/badge'
import { useNotify } from 'react-admin'

interface EmbedCodeDisplayProps {
  config: any
}

export const EmbedCodeDisplay = ({ config }: EmbedCodeDisplayProps) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const notify = useNotify()

  const copyToClipboard = (text: string, tab: string) => {
    navigator.clipboard.writeText(text)
    setCopiedTab(tab)
    notify('Code copied to clipboard!', { type: 'success' })
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    notify('Code downloaded!', { type: 'success' })
  }

  // Generate HTML/JS embed code
  const generateHTMLCode = () => {
    const widgetId = 'search-widget-' + Math.random().toString(36).substr(2, 9)
    return `<!-- Search Widget Embed Code -->
<div id="${widgetId}"></div>

<script>
  (function() {
    var config = ${JSON.stringify(config, null, 2)};

    // Widget initialization
    var script = document.createElement('script');
    script.src = 'https://cdn.yourdomain.com/search-widget.js';
    script.onload = function() {
      SearchWidget.init('${widgetId}', config);
    };
    document.head.appendChild(script);

    // Load widget styles
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.yourdomain.com/search-widget.css';
    document.head.appendChild(link);
  })();
</script>

<!-- Optional: Custom styling -->
<style>
  #${widgetId} {
    max-width: 100%;
    margin: 0 auto;
  }
</style>`
  }

  // Generate React component code
  const generateReactCode = () => {
    return `import React from 'react';
import { SearchWidget } from '@yourdomain/search-widget';
import '@yourdomain/search-widget/dist/styles.css';

const MySearchWidget = () => {
  const config = ${JSON.stringify(config, null, 2)};

  return (
    <SearchWidget
      collection="${config.searchSettings?.collection || 'your-collection'}"
      placeholder="${config.searchSettings?.placeholder || 'Search...'}"
      searchFields={${JSON.stringify(config.searchSettings?.searchFields || ['title', 'content'])}}
      resultsPerPage={${config.searchSettings?.resultsPerPage || 10}}
      theme={{
        primaryColor: "${config.theme?.primaryColor || '#3b82f6'}",
        secondaryColor: "${config.theme?.secondaryColor || '#64748b'}",
        fontFamily: "${config.theme?.fontFamily || 'Inter, sans-serif'}",
        borderRadius: "${config.theme?.borderRadius || '0.5rem'}",
      }}
      features={{
        autocomplete: ${config.features?.autocomplete || false},
        spellcheck: ${config.features?.spellcheck || false},
        facetedSearch: ${config.features?.facetedSearch || false},
        instantSearch: ${config.features?.instantSearch || true},
        voiceSearch: ${config.features?.voiceSearch || false},
      }}
      displaySettings={{
        layout: "${config.displaySettings?.layout || 'list'}",
        showThumbnails: ${config.displaySettings?.showThumbnails || false},
        showSnippets: ${config.displaySettings?.showSnippets || true},
        highlightMatches: ${config.displaySettings?.highlightMatches || true},
      }}
    />
  );
};

export default MySearchWidget;`
  }

  // Generate Vue component code
  const generateVueCode = () => {
    return `<template>
  <SearchWidget
    :collection="collection"
    :placeholder="placeholder"
    :search-fields="searchFields"
    :results-per-page="resultsPerPage"
    :theme="theme"
    :features="features"
    :display-settings="displaySettings"
  />
</template>

<script>
import { SearchWidget } from '@yourdomain/search-widget';
import '@yourdomain/search-widget/dist/styles.css';

export default {
  name: 'MySearchWidget',
  components: {
    SearchWidget,
  },
  data() {
    return {
      collection: "${config.searchSettings?.collection || 'your-collection'}",
      placeholder: "${config.searchSettings?.placeholder || 'Search...'}",
      searchFields: ${JSON.stringify(config.searchSettings?.searchFields || ['title', 'content'])},
      resultsPerPage: ${config.searchSettings?.resultsPerPage || 10},
      theme: {
        primaryColor: "${config.theme?.primaryColor || '#3b82f6'}",
        secondaryColor: "${config.theme?.secondaryColor || '#64748b'}",
        fontFamily: "${config.theme?.fontFamily || 'Inter, sans-serif'}",
        borderRadius: "${config.theme?.borderRadius || '0.5rem'}",
      },
      features: {
        autocomplete: ${config.features?.autocomplete || false},
        spellcheck: ${config.features?.spellcheck || false},
        facetedSearch: ${config.features?.facetedSearch || false},
        instantSearch: ${config.features?.instantSearch || true},
        voiceSearch: ${config.features?.voiceSearch || false},
      },
      displaySettings: {
        layout: "${config.displaySettings?.layout || 'list'}",
        showThumbnails: ${config.displaySettings?.showThumbnails || false},
        showSnippets: ${config.displaySettings?.showSnippets || true},
        highlightMatches: ${config.displaySettings?.highlightMatches || true},
      },
    };
  },
};
</script>`
  }

  // Generate installation instructions
  const generateInstallInstructions = () => {
    return `# Installation Instructions

## Using NPM
\`\`\`bash
npm install @yourdomain/search-widget
\`\`\`

## Using Yarn
\`\`\`bash
yarn add @yourdomain/search-widget
\`\`\`

## Using CDN (HTML)
\`\`\`html
<link rel="stylesheet" href="https://cdn.yourdomain.com/search-widget.css">
<script src="https://cdn.yourdomain.com/search-widget.js"></script>
\`\`\`

## Configuration

1. Copy the embed code from the appropriate tab (HTML, React, or Vue)
2. Paste it into your application
3. Replace 'your-collection' with your Typesense collection name
4. Customize the configuration as needed

## API Key Setup

Make sure to set up your Typesense API key:

\`\`\`javascript
SearchWidget.init('widget-container', {
  ...config,
  apiKey: 'YOUR_SEARCH_ONLY_API_KEY',
  host: 'YOUR_TYPESENSE_HOST',
  protocol: 'https',
  port: '443',
});
\`\`\`

## Support

For more information, visit our documentation at https://docs.yourdomain.com`
  }

  const htmlCode = generateHTMLCode()
  const reactCode = generateReactCode()
  const vueCode = generateVueCode()
  const installInstructions = generateInstallInstructions()

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader>
            <CardTitle>Embed Code Generator</CardTitle>
            <CardDescription>
              Choose your framework and copy the code to integrate the search widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="html">HTML/JS</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
                <TabsTrigger value="vue">Vue</TabsTrigger>
                <TabsTrigger value="install">Installation</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge>Vanilla JavaScript</Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(htmlCode, 'html')}
                    >
                      {copiedTab === 'html' ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCode(htmlCode, 'search-widget.html')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
                  <code>{htmlCode}</code>
                </pre>
              </TabsContent>

              <TabsContent value="react" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge>React Component</Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(reactCode, 'react')}
                    >
                      {copiedTab === 'react' ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCode(reactCode, 'SearchWidget.jsx')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
                  <code>{reactCode}</code>
                </pre>
              </TabsContent>

              <TabsContent value="vue" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge>Vue Component</Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(vueCode, 'vue')}
                    >
                      {copiedTab === 'vue' ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCode(vueCode, 'SearchWidget.vue')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
                  <code>{vueCode}</code>
                </pre>
              </TabsContent>

              <TabsContent value="install" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge>Setup Guide</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(installInstructions, 'install')}
                  >
                    {copiedTab === 'install' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
                  <code>{installInstructions}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader>
            <CardTitle>Widget URL</CardTitle>
            <CardDescription>
              Standalone URL for testing your widget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={`https://widgets.yourdomain.com/widget/${Math.random().toString(36).substr(2, 9)}`}
                readOnly
                className="flex-1 border rounded px-3 py-2 bg-gray-50"
              />
              <Button variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Use this URL to preview your widget in a standalone page or share it with others.
            </p>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
