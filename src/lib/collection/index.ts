import { httpGet } from '../api'
import { BonadocsError } from '../errors'
import { loadFromIPFSWithTimeout } from '../ipfs'
import { getCollectionStore } from '../storage'
import { jsonUtils } from '../util'

import { CollectionDataManager } from './data-manager'
import { CollectionData, validateCollection } from './spec'
import { generateCollectionId } from './util'

export * from './data-manager'
export * from './execution'
export * from './simulation'
export * from './types'
export * from './spec'

export class Collection {
  #data: CollectionData
  #manager: CollectionDataManager | undefined

  /**
   * Create an instance of a collection. The collection class exposes methods to read/set
   * properties,
   * @param name
   * @param description
   */
  private constructor(name: string, description: string) {
    if (!name || !description) {
      throw Error('Collection name and description are required')
    }

    this.#data = {
      id: generateCollectionId(),
      name,
      description,
      strings: {},
      contractInterfaces: [],
      links: [],
      variables: [],
      contracts: [],
      workflows: [],
    }
  }

  /**
   * Create a new collection with the given name and description.
   * @param name
   * @param description
   */
  static createBlankCollection(name: string, description: string) {
    return new Collection(name, description)
  }

  /**
   * Loads a collection from IPFS.
   * @param uri
   */
  static async createFromIPFS(uri: string) {
    if (!uri.startsWith('ipfs://')) {
      throw Error('Invalid IPFS URI')
    }

    const data = await loadFromIPFSWithTimeout(uri.substring(7), 5000)
    if (!data) {
      throw Error('Failed to load collection data. Not found on IPFS network.')
    }

    if (typeof data !== 'string') {
      return this.createFromSnapshot(JSON.stringify(data))
    }
    return this.createFromSnapshot(data)
  }

  static async createFromURI(uri: string) {
    if (uri.startsWith('ipfs://')) {
      return this.createFromIPFS(uri)
    }

    if (uri.startsWith('https://')) {
      const responseData = await httpGet(uri)
      if (!responseData) {
        throw Error(`Failed to load collection data at ${uri}.`)
      }

      if (typeof responseData !== 'string') {
        return this.createFromSnapshot(JSON.stringify(responseData))
      }
      return this.createFromSnapshot(responseData)
    }

    throw Error('Invalid URI')
  }

  /**
   * Loads a collection from a JSON snapshot.
   * @param snapshot
   */
  static createFromSnapshot(snapshot: string) {
    const data = JSON.parse(snapshot, jsonUtils.reviver)
    const validationResult = validateCollection(data)
    if (!validationResult.status) {
      throw new BonadocsError(validationResult)
    }

    const collection = new Collection(data.name, data.description)
    collection.#data = data
    return collection
  }

  static async createFromLocalStore(id: string) {
    const store = await getCollectionStore(id)
    const snapshot = await store.get('data')
    if (!snapshot) {
      throw new Error(`Collection ${id} not found`)
    }
    return this.createFromSnapshot(snapshot)
  }

  /**
   * Returns the collection data manager
   */
  get manager(): CollectionDataManager {
    if (!this.#manager) {
      this.#manager = new CollectionDataManager(this.#data)
    }
    return this.#manager
  }
}
