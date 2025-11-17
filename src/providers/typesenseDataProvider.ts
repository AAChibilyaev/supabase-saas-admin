import type { DataProvider } from 'react-admin'
import { typesenseClient } from './typesenseClient'

export const typesenseDataProvider: DataProvider = {
  // API Keys Management
  getList: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // System Operations - not applicable for getList
    if (resource === 'typesense-system') {
      return {
        data: [],
        total: 0
      }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      try {
        const result = await typesenseClient.aliases().retrieve()
        const aliases = result.aliases || []

        return {
          data: aliases.map((alias: any) => ({
            ...alias,
            id: alias.name
          })),
          total: aliases.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense aliases:', error)
        throw error
      }
    }

    // NL Models Management (placeholder - API may not be available yet)
    if (resource === 'typesense-nl-models') {
      try {
        // Placeholder: Return empty list for now as the API endpoint may not exist yet
        return {
          data: [],
          total: 0
        }
      } catch (error) {
        console.error('Failed to retrieve NL models:', error)
        return { data: [], total: 0 }
      }
    }

    // Stemming Dictionaries Management
    if (resource === 'typesense-stemming') {
      try {
        // Note: Typesense doesn't have a built-in stemming dictionary API
        // This is a mock implementation that could be backed by a custom storage
        // In production, you might store these in a separate database or file system
        const result = await (typesenseClient as any).stemming?.dictionaries?.retrieve?.() || { dictionaries: [] }
        const dictionaries = result.dictionaries || []

        return {
          data: dictionaries.map((dict: any) => ({
            ...dict,
            id: dict.id
          })),
          total: dictionaries.length
        }
      } catch (error) {
        console.error('Failed to retrieve stemming dictionaries:', error)
        // Return empty array as stemming API might not be available
        return { data: [], total: 0 }
      }
    }

    if (resource === 'typesense-keys') {
      try {
        const result = await typesenseClient.keys().retrieve()
        const keys = result.keys || []

        return {
          data: keys.map((key: any) => ({
            ...key,
            id: key.id.toString()
          })),
          total: keys.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense keys:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const result = await (typesenseClient as any).stopwords().retrieve()
        const stopwords = result.stopwords || []

        return {
          data: stopwords.map((stopwordSet: any) => ({
            ...stopwordSet,
            id: stopwordSet.id
          })),
          total: stopwords.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense stopwords:', error)
        throw error
      }
    }

    // Curation Sets Management
    if (resource === 'typesense-curations') {
      try {
        const result = await typesenseClient.multiSearch.perform({
          searches: []
        })
        // Note: Typesense doesn't have a direct API to list all curation sets
        // We'll need to handle this differently - for now return empty array
        // In production, you might need to track curation sets separately
        return {
          data: [],
          total: 0
        }
      } catch (error) {
        console.error('Failed to retrieve curation sets:', error)
        throw error
      }
    }

    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        // Get the collection name from the filter or use a default
        const collectionName = params.filter?.collection || 'products'

        const result = await typesenseClient
          .collections(collectionName)
          .synonyms()
          .retrieve()

        const synonyms = result.synonyms || []

        return {
          data: synonyms.map((synonym: any) => ({
            ...synonym,
            id: synonym.id
          })),
          total: synonyms.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense synonyms:', error)
        throw error
      }
    }

    // Presets Management
    if (resource === 'presets') {
      try {
        const result = await (typesenseClient as any).presets().retrieve()
        const presets = result.presets || []

        return {
          data: presets.map((preset: any) => ({
            ...preset,
            id: preset.name
          })),
          total: presets.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense presets:', error)
        throw error
      }
    }

    // NL Models Management
    if (resource === 'typesense-nl-models') {
      try {
        const result = await (typesenseClient as any).models().retrieve()
        const models = result.models || []

        return {
          data: models.map((model: any) => ({
            ...model,
            id: model.model_name || model.id
          })),
          total: models.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense NL models:', error)
        throw error
      }
    }

    // For other Typesense resources (collections, documents, etc.)
    const { page, perPage } = params.pagination
    const { field, order } = params.sort

    try {
      const result = await typesenseClient
        .collections(resource)
        .documents()
        .search({
          q: params.filter.q || '*',
          query_by: params.filter.query_by || '*',
          filter_by: params.filter.filter_by || '',
          per_page: perPage,
          page: page,
          sort_by: field ? `${field}:${order.toLowerCase()}` : undefined,
        })

      return {
        data: result.hits?.map((hit: any) => ({
          ...hit.document,
          id: hit.document.id
        })) || [],
        total: result.found || 0,
      }
    } catch (error) {
      console.error('Typesense getList error:', error)
      throw error
    }
  },

  getOne: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // Stemming Dictionaries Management
    if (resource === 'typesense-stemming') {
      try {
        const result = await (typesenseClient as any).stemming?.dictionaries?.(params.id)?.retrieve?.()
        return {
          data: {
            ...result,
            id: result.id || params.id
          }
        }
      } catch (error) {
        console.error('Failed to retrieve stemming dictionary:', error)
        throw error
      }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      try {
        const result = await typesenseClient.aliases(params.id).retrieve()
        return {
          data: {
            ...result,
            id: result.name
          }
        }
      } catch (error) {
        console.error('Failed to retrieve alias:', error)
        throw error
      }
    }

    if (resource === 'typesense-keys') {
      try {
        const result = await typesenseClient.keys(params.id).retrieve()
        return { data: { ...result, id: result.id.toString() } }
      } catch (error) {
        console.error('Failed to retrieve Typesense key:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const result = await (typesenseClient as any).stopwords().retrieve()
        const stopwords = result.stopwords || []

        return {
          data: stopwords.map((stopwordSet: any) => ({
            ...stopwordSet,
            id: stopwordSet.id
          })),
          total: stopwords.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense stopwords:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const result = await (typesenseClient as any).stopwords(params.id).retrieve()
        return {
          data: {
            ...result,
            id: result.id
          }
        }
      } catch (error) {
        console.error('Failed to retrieve stopwords set:', error)
        throw error
      }
    }

    // Curation Sets Management
    if (resource === 'typesense-curations') {
      try {
        // Extract collection and curation name from ID (format: collection:curationName)
        const [collection, curationName] = params.id.toString().split(':')
        const result = await (typesenseClient as any)
          .collections(collection)
          .overrides(curationName)
          .retrieve()
        return {
          data: {
            ...result,
            id: params.id,
            collection,
            name: curationName
          }
        }
      } catch (error) {
        console.error('Failed to retrieve curation set:', error)
        throw error
      }
    }

    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        // Extract collection and synonym name from ID (format: collection:synonymId)
        const [collection, synonymId] = params.id.toString().split(':')
        const result = await typesenseClient
          .collections(collection)
          .synonyms(synonymId)
          .retrieve()
        return {
          data: {
            ...result,
            id: params.id
          }
        }
      } catch (error) {
        console.error('Failed to retrieve synonym set:', error)
        throw error
      }
    }

    // Presets Management
    if (resource === 'presets') {
      try {
        const result = await (typesenseClient as any).presets(params.id).retrieve()
        return {
          data: {
            ...result,
            id: result.name
          }
        }
      } catch (error) {
        console.error('Failed to retrieve preset:', error)
        throw error
      }
    }

    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const { collection = 'products', id, synonymType, ...synonymData } = params.data

        // Build synonym schema based on type
        const synonymSchema: any = {
          id: id
        }

        // Handle one-way vs multi-way synonyms
        if (synonymType === 'one-way' && synonymData.root) {
          // One-way synonym: A → B
          synonymSchema.root = synonymData.root
          synonymSchema.synonyms = synonymData.synonyms || []
        } else {
          // Multi-way synonym: A ↔ B ↔ C
          synonymSchema.synonyms = synonymData.synonyms || []
        }

        const result = await typesenseClient
          .collections(collection)
          .synonyms()
          .upsert(id, synonymSchema)

        return {
          data: {
            ...result,
            id: `${collection}:${id}`
          }
        }
      } catch (error) {
        console.error('Failed to create synonym set:', error)
        throw error
      }
    }


    const result = await typesenseClient
      .collections(resource)
      .documents(params.id.toString())
      .retrieve()

    return { data: { ...result, id: result.id } }
  },

  getMany: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    if (resource === 'typesense-keys') {
      // Keys don't support batch retrieval, fetch individually
      const promises = params.ids.map(id =>
        typesenseClient.keys(id).retrieve()
      )

      const results = await Promise.all(promises)
      return {
        data: results.map((r: any) => ({ ...r, id: r.id.toString() }))
      }
    }

    const promises = params.ids.map(id =>
      typesenseClient
        .collections(resource)
        .documents(id.toString())
        .retrieve()
    )

    const results = await Promise.all(promises)
    return { data: results.map((r: any) => ({ ...r, id: r.id })) }
  },

  getManyReference: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    const { page, perPage } = params.pagination
    const { field, order } = params.sort

    const result = await typesenseClient
      .collections(resource)
      .documents()
      .search({
        q: '*',
        filter_by: `${params.target}:=${params.id}`,
        per_page: perPage,
        page: page,
        sort_by: field ? `${field}:${order.toLowerCase()}` : undefined,
      })

    return {
      data: result.hits?.map((hit: any) => ({
        ...hit.document,
        id: hit.document.id
      })) || [],
      total: result.found || 0,
    }
  },

  create: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // Stemming Dictionaries Management
    if (resource === 'typesense-stemming') {
      try {
        const { id, language, description, rules } = params.data
        const parsedRules = typeof rules === 'string' ? JSON.parse(rules) : rules

        const result = await (typesenseClient as any).stemming?.dictionaries?.upsert?.(id, {
          id,
          language,
          description,
          rules: parsedRules
        }) || {
          id,
          language,
          description,
          rules: parsedRules
        }

        return {
          data: {
            ...result,
            id: result.id || id
          }
        }
      } catch (error) {
        console.error('Failed to create stemming dictionary:', error)
        throw error
      }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      try {
        const { name, collection_name } = params.data
        const result = await typesenseClient.aliases().upsert(name, {
          collection_name
        })

        return {
          data: {
            ...result,
            id: result.name
          }
        }
      } catch (error) {
        console.error('Failed to create alias:', error)
        throw error
      }
    }

    if (resource === 'typesense-keys') {
      try {
        // Build key schema with proper Typesense API format
        const keySchema: any = {
          description: params.data.description,
          actions: params.data.actions || ['documents:search'],
          collections: params.data.collections || ['*'],
        }

        // Add expiration if provided
        if (params.data.expires_at) {
          const expiresDate = new Date(params.data.expires_at)
          keySchema.expires_at = Math.floor(expiresDate.getTime() / 1000)
        }

        const result = await typesenseClient.keys().create(keySchema)

        // IMPORTANT: Return the key value (shown only once!)
        return {
          data: {
            ...result,
            id: result.id.toString(),
            value: result.value // This is the actual API key - shown only once
          }
        }
      } catch (error) {
        console.error('Failed to create Typesense key:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const result = await (typesenseClient as any).stopwords().retrieve()
        const stopwords = result.stopwords || []

        return {
          data: stopwords.map((stopwordSet: any) => ({
            ...stopwordSet,
            id: stopwordSet.id
          })),
          total: stopwords.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense stopwords:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const { id, stopwords, locale } = params.data
        const result = await (typesenseClient as any)
          .stopwords()
          .upsert(id, {
            stopwords: stopwords || [],
            locale: locale || 'en'
          })

        return {
          data: {
            ...result,
            id: result.id
          }
        }
      } catch (error) {
        console.error('Failed to create stopwords set:', error)
        throw error
      }
    }

    // Curation Sets Management
    if (resource === 'typesense-curations') {
      try {
        const { collection, name, rule } = params.data
        const result = await (typesenseClient as any)
          .collections(collection)
          .overrides()
          .upsert(name, rule)

        return {
          data: {
            ...result,
            id: `${collection}:${name}`,
            collection,
            name
          }
        }
      } catch (error) {
        console.error('Failed to create curation set:', error)
        throw error
      }
    }

    // Presets Management
    if (resource === 'presets') {
      try {
        const { name, ...presetData } = params.data
        const result = await (typesenseClient as any)
          .presets()
          .upsert(name, presetData)

        return {
          data: {
            ...result,
            id: result.name
          }
        }
      } catch (error) {
        console.error('Failed to create preset:', error)
        throw error
      }
    }

    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const { collection = 'products', id, synonymType, ...synonymData } = params.data

        // Build synonym schema based on type
        const synonymSchema: any = {
          id: id
        }

        // Handle one-way vs multi-way synonyms
        if (synonymType === 'one-way' && synonymData.root) {
          // One-way synonym: A → B
          synonymSchema.root = synonymData.root
          synonymSchema.synonyms = synonymData.synonyms || []
        } else {
          // Multi-way synonym: A ↔ B ↔ C
          synonymSchema.synonyms = synonymData.synonyms || []
        }

        const result = await typesenseClient
          .collections(collection)
          .synonyms()
          .upsert(id, synonymSchema)

        return {
          data: {
            ...result,
            id: `${collection}:${id}`
          }
        }
      } catch (error) {
        console.error('Failed to create synonym set:', error)
        throw error
      }
    }


    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const { collection = 'products', id, synonymType, ...synonymData } = params.data

        // Build synonym schema based on type
        const synonymSchema: any = {
          id: id
        }

        // Handle one-way vs multi-way synonyms
        if (synonymType === 'one-way' && synonymData.root) {
          // One-way synonym: A → B
          synonymSchema.root = synonymData.root
          synonymSchema.synonyms = synonymData.synonyms || []
        } else {
          // Multi-way synonym: A ↔ B ↔ C
          synonymSchema.synonyms = synonymData.synonyms || []
        }

        const result = await typesenseClient
          .collections(collection)
          .synonyms()
          .upsert(id, synonymSchema)

        return {
          data: {
            ...result,
            id: `${collection}:${id}`
          }
        }
      } catch (error) {
        console.error('Failed to create synonym set:', error)
        throw error
      }
    }

    const result = await typesenseClient
      .collections(resource)
      .documents()
      .create(params.data)

    return { data: { ...result, id: result.id } }
  },

  update: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // Stemming Dictionaries Management
    if (resource === 'typesense-stemming') {
      try {
        const dictionaryId = params.id.toString()
        const { language, description, rules } = params.data
        const parsedRules = typeof rules === 'string' ? JSON.parse(rules) : rules

        const result = await (typesenseClient as any).stemming?.dictionaries?.upsert?.(dictionaryId, {
          id: dictionaryId,
          language,
          description,
          rules: parsedRules
        }) || {
          id: dictionaryId,
          language,
          description,
          rules: parsedRules
        }

        return {
          data: {
            ...result,
            id: result.id || dictionaryId
          }
        }
      } catch (error) {
        console.error('Failed to update stemming dictionary:', error)
        throw error
      }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      try {
        const aliasName = params.id.toString()
        const { collection_name } = params.data
        const result = await typesenseClient.aliases().upsert(aliasName, {
          collection_name
        })

        return {
          data: {
            ...result,
            id: result.name
          }
        }
      } catch (error) {
        console.error('Failed to update alias:', error)
        throw error
      }
    }

    // API keys cannot be updated in Typesense, only deleted and recreated
    if (resource === 'typesense-keys') {
      throw new Error('Typesense API keys cannot be updated. Please delete and create a new key.')
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const result = await (typesenseClient as any).stopwords().retrieve()
        const stopwords = result.stopwords || []

        return {
          data: stopwords.map((stopwordSet: any) => ({
            ...stopwordSet,
            id: stopwordSet.id
          })),
          total: stopwords.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense stopwords:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const stopwordSetId = params.id.toString()
        const { stopwords, locale } = params.data
        const result = await (typesenseClient as any)
          .stopwords()
          .upsert(stopwordSetId, {
            stopwords: stopwords || [],
            locale: locale || 'en'
          })

        return {
          data: {
            ...result,
            id: result.id
          }
        }
      } catch (error) {
        console.error('Failed to update stopwords set:', error)
        throw error
      }
    }

    // Curation Sets Management
    if (resource === 'typesense-curations') {
      try {
        const [collection, curationName] = params.id.toString().split(':')
        const { rule } = params.data
        const result = await (typesenseClient as any)
          .collections(collection)
          .overrides()
          .upsert(curationName, rule)

        return {
          data: {
            ...result,
            id: params.id,
            collection,
            name: curationName
          }
        }
      } catch (error) {
        console.error('Failed to update curation set:', error)
        throw error
      }
    }

    // Presets Management
    if (resource === 'presets') {
      try {
        const presetName = params.id.toString()
        const { name, ...presetData } = params.data
        const result = await (typesenseClient as any)
          .presets()
          .upsert(presetName, presetData)

        return {
          data: {
            ...result,
            id: result.name
          }
        }
      } catch (error) {
        console.error('Failed to update preset:', error)
        throw error
      }
    }

    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const { collection = 'products', id, synonymType, ...synonymData } = params.data

        // Build synonym schema based on type
        const synonymSchema: any = {
          id: id
        }

        // Handle one-way vs multi-way synonyms
        if (synonymType === 'one-way' && synonymData.root) {
          // One-way synonym: A → B
          synonymSchema.root = synonymData.root
          synonymSchema.synonyms = synonymData.synonyms || []
        } else {
          // Multi-way synonym: A ↔ B ↔ C
          synonymSchema.synonyms = synonymData.synonyms || []
        }

        const result = await typesenseClient
          .collections(collection)
          .synonyms()
          .upsert(id, synonymSchema)

        return {
          data: {
            ...result,
            id: `${collection}:${id}`
          }
        }
      } catch (error) {
        console.error('Failed to create synonym set:', error)
        throw error
      }
    }


    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const [collection, synonymId] = params.id.toString().split(':')
        const { root, synonyms } = params.data

        // Build synonym schema
        const synonymSchema: any = {
          id: synonymId
        }

        // Determine if one-way or multi-way based on presence of root
        if (root) {
          synonymSchema.root = root
          synonymSchema.synonyms = synonyms || []
        } else {
          synonymSchema.synonyms = synonyms || []
        }

        const result = await typesenseClient
          .collections(collection)
          .synonyms()
          .upsert(synonymId, synonymSchema)

        return {
          data: {
            ...result,
            id: params.id
          }
        }
      } catch (error) {
        console.error('Failed to update synonym set:', error)
        throw error
      }
    }

    const result = await typesenseClient
      .collections(resource)
      .documents(params.id.toString())
      .update(params.data)

    return { data: { ...result, id: result.id } }
  },

  updateMany: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // Not supported for API keys
    if (resource === 'typesense-keys') {
      throw new Error('Batch update not supported for Typesense API keys')
    }

    // Use bulk import for better performance
    const documents = params.ids.map(id => ({
      id,
      ...params.data
    }))

    await typesenseClient
      .collections(resource)
      .documents()
      .import(documents, { action: 'upsert', batch_size: 100 })

    return { data: params.ids }
  },

  delete: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // Stemming Dictionaries Management
    if (resource === 'typesense-stemming') {
      try {
        await (typesenseClient as any).stemming?.dictionaries?.(params.id)?.delete?.()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete stemming dictionary:', error)
        throw error
      }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      try {
        await typesenseClient.aliases(params.id).delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete alias:', error)
        throw error
      }
    }

    // Analytics Rules
    if (resource === 'typesense-analytics-rules') {
      try {
        await (typesenseClient as any).analytics.rules(params.id).delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete analytics rule:', error)
        throw error
      }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      try {
        await typesenseClient.aliases(params.id).delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete alias:', error)
        throw error
      }
    }

    if (resource === 'typesense-keys') {
      try {
        await typesenseClient.keys(params.id).delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete Typesense key:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const result = await (typesenseClient as any).stopwords().retrieve()
        const stopwords = result.stopwords || []

        return {
          data: stopwords.map((stopwordSet: any) => ({
            ...stopwordSet,
            id: stopwordSet.id
          })),
          total: stopwords.length
        }
      } catch (error) {
        console.error('Failed to retrieve Typesense stopwords:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        const stopwordSetId = params.id.toString()
        const { stopwords, locale } = params.data
        const result = await (typesenseClient as any)
          .stopwords()
          .upsert(stopwordSetId, {
            stopwords: stopwords || [],
            locale: locale || 'en'
          })

        return {
          data: {
            ...result,
            id: result.id
          }
        }
      } catch (error) {
        console.error('Failed to update stopwords set:', error)
        throw error
      }
    }

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      try {
        await (typesenseClient as any).stopwords(params.id).delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete stopwords set:', error)
        throw error
      }
    }

    // Curation Sets Management
    if (resource === 'typesense-curations') {
      try {
        const [collection, curationName] = params.id.toString().split(':')
        await (typesenseClient as any)
          .collections(collection)
          .overrides(curationName)
          .delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete curation set:', error)
        throw error
      }
    }

    // Presets Management
    if (resource === 'presets') {
      try {
        await (typesenseClient as any).presets(params.id).delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete preset:', error)
        throw error
      }
    }

    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const { collection = 'products', id, synonymType, ...synonymData } = params.data

        // Build synonym schema based on type
        const synonymSchema: any = {
          id: id
        }

        // Handle one-way vs multi-way synonyms
        if (synonymType === 'one-way' && synonymData.root) {
          // One-way synonym: A → B
          synonymSchema.root = synonymData.root
          synonymSchema.synonyms = synonymData.synonyms || []
        } else {
          // Multi-way synonym: A ↔ B ↔ C
          synonymSchema.synonyms = synonymData.synonyms || []
        }

        const result = await typesenseClient
          .collections(collection)
          .synonyms()
          .upsert(id, synonymSchema)

        return {
          data: {
            ...result,
            id: `${collection}:${id}`
          }
        }
      } catch (error) {
        console.error('Failed to create synonym set:', error)
        throw error
      }
    }


    // Synonym Sets Management
    if (resource === 'typesense-synonyms') {
      try {
        const [collection, synonymId] = params.id.toString().split(':')
        await typesenseClient
          .collections(collection)
          .synonyms(synonymId)
          .delete()
        return { data: { id: params.id } }
      } catch (error) {
        console.error('Failed to delete synonym set:', error)
        throw error
      }
    }

    const result = await typesenseClient
      .collections(resource)
      .documents(params.id.toString())
      .delete()

    return { data: { ...result, id: params.id } }
  },

  deleteMany: async (resource, params) => {
    if (!typesenseClient) {
      throw new Error('Typesense client is not initialized')
    }

    // Stemming Dictionaries Management
    if (resource === 'typesense-stemming') {
      const promises = params.ids.map(id =>
        (typesenseClient as any).stemming?.dictionaries?.(id)?.delete?.()
      )

      await Promise.all(promises)
      return { data: params.ids }
    }

    // Aliases Management
    if (resource === 'typesense-aliases') {
      const promises = params.ids.map(id =>
        typesenseClient.aliases(id).delete()
      )

      await Promise.all(promises)
      return { data: params.ids }
    }

    if (resource === 'typesense-keys') {
      // Delete keys individually

    // Stopwords Management
    if (resource === 'typesense-stopwords') {
      // Delete stopwords sets individually
      const promises = params.ids.map(id =>
        (typesenseClient as any).stopwords(id).delete()
      )

      await Promise.all(promises)
      return { data: params.ids }
    }

      const promises = params.ids.map(id =>
        typesenseClient.keys(id).delete()
      )

      await Promise.all(promises)
      return { data: params.ids }
    }

    const promises = params.ids.map(id =>
      typesenseClient
        .collections(resource)
        .documents(id.toString())
        .delete()
    )

    await Promise.all(promises)
    return { data: params.ids }
  },
}
