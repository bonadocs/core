import os from 'os'
import path from 'path'

import { IndexedDBStorage } from './IndexedDBStorage'
import { StorageAPI } from './StorageAPI'

const collectionStores: Record<string, StorageAPI> = {}
let localCollectionNameStore: StorageAPI | null = null

export async function getCollectionStore(
  collectionId: string,
  collectionName?: string,
): Promise<StorageAPI> {
  if (!collectionStores[collectionId]) {
    collectionStores[collectionId] = await createCollectionStore(collectionId)
  }

  if (collectionName) {
    storeCollectionIdAndName(collectionId, collectionName)
  }
  return collectionStores[collectionId]
}

export async function getLocalCollectionNames(): Promise<
  Record<string, { name: string; lastAccessTimestamp: number }>
> {
  const store = await getLocalCollectionNameStore()
  const names = await store.get('collectionNames')
  if (!names) {
    return {}
  }

  return JSON.parse(names)
}

export function deleteLocalCollectionName(collectionId: string) {
  getLocalCollectionNames()
    .then(async (names) => {
      delete names[collectionId]

      const store = await getLocalCollectionNameStore()
      return await store.set('collectionNames', JSON.stringify(names))
    })
    .catch((error) => {
      console.error(error)
    })
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
    const store = new FileStorage(directory, collectionId)
    await store.setup()
    return store
  }

  throw new Error('No storage implementation available for this environment')
}

/**
 * This store is used to store the names of collections that can be managed
 * on this device. This is not a strong guarantee that the collection exists,
 * but it can help with listing collections that can be managed.
 */
async function getLocalCollectionNameStore(): Promise<StorageAPI> {
  if (!localCollectionNameStore) {
    localCollectionNameStore = await createLocalCollectionNameStore()
  }
  return localCollectionNameStore
}

async function createLocalCollectionNameStore(): Promise<StorageAPI> {
  if (typeof window !== 'undefined' && typeof window?.indexedDB === 'object') {
    return new IndexedDBStorage('bonadocs', 'collections')
  }

  if (typeof process === 'object' && process?.versions?.node) {
    const { FileStorage } = await import('./FileStorage')
    const directory = path.join(os.homedir(), '.bonadocs', 'storage')
    const store = new FileStorage(directory, 'collections')
    await store.setup()
    return store
  }

  throw new Error('No storage implementation available for this environment')
}

function storeCollectionIdAndName(
  collectionId: string,
  collectionName: string,
) {
  getLocalCollectionNames()
    .then(async (names) => {
      names[collectionId] = {
        name: collectionName,
        lastAccessTimestamp: Date.now(),
      }

      const store = await getLocalCollectionNameStore()
      return await store.set('collectionNames', JSON.stringify(names))
    })
    .catch((error) => {
      console.error(error)
    })
}
