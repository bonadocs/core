import { StorageAPI } from './StorageAPI'
import { UnifiedStorage } from './UnifiedStorage'
import {
  deleteCollectionName,
  getLocalCollectionNames,
  indexCollectionName,
} from './name-indexer'

const collectionStores: Record<string, StorageAPI> = {}
let searchDBStore: StorageAPI | undefined = undefined
let metadataStore: StorageAPI | undefined = undefined

export { getLocalCollectionNames, deleteCollectionName }

UnifiedStorage.start().catch((e) => {
  throw e
})

export const stopUnifiedStorage = () => {
  UnifiedStorage.stop()
}

export async function getCollectionStore(
  collectionId: string,
  collectionName?: string,
): Promise<StorageAPI> {
  if (!collectionStores[collectionId]) {
    collectionStores[collectionId] = await UnifiedStorage.create(
      'collections',
      collectionId,
    )
  }

  if (collectionName) {
    indexCollectionName(collectionId, collectionName)
  }
  return collectionStores[collectionId]
}

export async function getSearchDBStore(): Promise<StorageAPI> {
  if (!searchDBStore) {
    searchDBStore = await UnifiedStorage.create('registry', 'index')
  }

  return searchDBStore
}

export async function getMetadataStore(): Promise<StorageAPI> {
  if (!metadataStore) {
    metadataStore = await UnifiedStorage.create('metadata', 'index')
  }

  return metadataStore
}
