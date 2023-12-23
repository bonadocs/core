import os from 'os'
import path from 'path'

import { IndexedDBStorage } from './IndexedDBStorage'
import { StorageAPI } from './StorageAPI'
import {
  deleteCollectionName,
  getLocalCollectionNames,
  indexCollectionName,
} from './name-indexer'

const collectionStores: Record<string, StorageAPI> = {}

export { getLocalCollectionNames, deleteCollectionName }

export async function getCollectionStore(
  collectionId: string,
  collectionName?: string,
): Promise<StorageAPI> {
  if (!collectionStores[collectionId]) {
    collectionStores[collectionId] = await createCollectionStore(collectionId)
  }

  if (collectionName) {
    indexCollectionName(collectionId, collectionName)
  }
  return collectionStores[collectionId]
}

async function createCollectionStore(
  collectionId: string,
): Promise<StorageAPI> {
  if (typeof window !== 'undefined' && typeof window?.indexedDB === 'object') {
    return new IndexedDBStorage('bonadocs', `collections-${collectionId}`)
  }

  if (typeof process === 'object' && process?.versions?.node) {
    const { FileStorage } = await import('./FileStorage')
    const directory = path.join(
      os.homedir(),
      '.bonadocs',
      'storage',
      'collections',
    )
    return await FileStorage.create(directory, collectionId)
  }

  throw new Error('No storage implementation available for this environment')
}
