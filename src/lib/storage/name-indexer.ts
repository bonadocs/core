import os from 'os'
import path from 'path'

import { IndexedDBStorage } from './IndexedDBStorage'
import { StorageAPI } from './StorageAPI'

type Job =
  | {
      type: 'setName'
      collectionId: string
      collectionName: string
    }
  | {
      type: 'deleteName'
      collectionId: string
    }

const jobs: Job[] = []
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
let localCollectionNameStore: StorageAPI | null = null

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

export function indexCollectionName(collectionId: string, name: string) {
  jobs.push({
    type: 'setName',
    collectionId,
    collectionName: name,
  })
}

export function deleteCollectionName(collectionId: string) {
  jobs.push({
    type: 'deleteName',
    collectionId,
  })
}

async function processJobs() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (jobs.length) {
      const job = jobs.shift()!
      switch (job.type) {
        case 'setName':
          await storeLocalCollectionIdAndName(
            job.collectionId,
            job.collectionName,
          )
          break
        case 'deleteName':
          await deleteLocalCollectionName(job.collectionId)
          break
      }
    } else {
      await sleep(100)
    }
  }
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
    return FileStorage.create(directory, 'collections')
  }

  throw new Error('No storage implementation available for this environment')
}

async function storeLocalCollectionIdAndName(
  collectionId: string,
  collectionName: string,
) {
  const names = await getLocalCollectionNames()
  names[collectionId] = {
    name: collectionName,
    lastAccessTimestamp: Date.now(),
  }

  const store = await getLocalCollectionNameStore()
  return await store.set('collectionNames', JSON.stringify(names))
}

async function deleteLocalCollectionName(collectionId: string) {
  const names = await getLocalCollectionNames()
  delete names[collectionId]

  const store = await getLocalCollectionNameStore()
  return await store.set('collectionNames', JSON.stringify(names))
}

processJobs().catch((e) => {
  throw e
})
