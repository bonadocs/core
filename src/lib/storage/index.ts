import { IndexedDBStorage } from './IndexedDBStorage'
import { StorageAPI } from './StorageAPI'

let collectionStore: StorageAPI | undefined
export function getCollectionStore(): StorageAPI {
  if (!collectionStore) {
    collectionStore = new IndexedDBStorage('bonadocs', 'collections')
  }
  return collectionStore
}
