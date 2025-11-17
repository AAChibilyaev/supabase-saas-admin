import { WordPressConnector } from './WordPressConnector'
import { ContentfulConnector } from './ContentfulConnector'
import { StrapiConnector } from './StrapiConnector'
import { GhostConnector } from './GhostConnector'
import { CustomConnector } from './CustomConnector'
import type { CMSConnector, CMSType } from '../../../types/cms'

const connectors: Record<CMSType, CMSConnector> = {
  wordpress: new WordPressConnector(),
  contentful: new ContentfulConnector(),
  strapi: new StrapiConnector(),
  ghost: new GhostConnector(),
  sanity: new CustomConnector(), // Can be extended later
  payload: new CustomConnector(), // Can be extended later
  directus: new CustomConnector(), // Can be extended later
  custom: new CustomConnector()
}

export function getConnector(type: CMSType): CMSConnector {
  return connectors[type]
}

export {
  WordPressConnector,
  ContentfulConnector,
  StrapiConnector,
  GhostConnector,
  CustomConnector
}
