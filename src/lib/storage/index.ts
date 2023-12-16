import os from 'os'
import path from 'path'

import { IndexedDBStorage } from './IndexedDBStorage'
import { StorageAPI } from './StorageAPI'

const collectionStores: Record<string, StorageAPI> = {}
export async function getCollectionStore(
  collectionId: string,
): Promise<StorageAPI> {
  if (!collectionStores[collectionId]) {
    collectionStores[collectionId] = await createCollectionStore(collectionId)
  }
  return collectionStores[collectionId]
}

async function createCollectionStore(
  collectionId: string,
): Promise<StorageAPI> {
  if (typeof window?.indexedDB === 'object') {
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
    return new FileStorage(directory, collectionId)
  }

  throw new Error('No storage implementation available for this environment')
}
