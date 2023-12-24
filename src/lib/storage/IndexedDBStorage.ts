import { StorageAPI } from './StorageAPI'

/**
 * A storage implementation that uses the IndexedDB API.
 */
export class IndexedDBStorage implements StorageAPI {
  readonly #dbPromise: Promise<void>
  #db: IDBDatabase | null = null

  constructor(
    private readonly dbName: string,
    private readonly storeName: string,
    private readonly version = 1,
  ) {
    this.#dbPromise = this.openDatabase()
      .then((db) => {
        this.#db = db
      })
      .catch((err) => {
        throw new Error(`Failed to open database: ${err}`)
      })
  }

  transaction(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async get(key: string): Promise<string | null> {
    await this.#dbPromise
    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(this.storeName, 'readonly')
      const request = transaction.objectStore(this.storeName).get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async set(key: string, value: string): Promise<void> {
    await this.#dbPromise
    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(this.storeName, 'readwrite')
      const request = transaction.objectStore(this.storeName).put(value, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async remove(key: string): Promise<void> {
    await this.#dbPromise
    return new Promise((resolve, reject) => {
      const transaction = this.#db!.transaction(this.storeName, 'readwrite')
      const request = transaction.objectStore(this.storeName).delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}
