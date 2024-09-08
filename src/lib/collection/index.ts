import { getApi, httpGet } from '../api'
import { BonadocsError } from '../errors'
import { loadFromIPFSWithTimeout } from '../ipfs'
import { loadProtocolMetadata } from '../search'
import { getCollectionStore } from '../storage'
import { jsonUtils } from '../util'

import { CollectionDataManager } from './data-manager'
import {
  CollectionData,
  CollectionDataSnapshot,
  validateCollection,
} from './spec'
import { generateRandomId } from './util'

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
      id: generateRandomId(),
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

    return this.createFromSnapshot(data as CollectionDataSnapshot)
  }

  /**
   * Loads a collection from the Bonadocs API. You must have configured auth on
   * the bonadocs API before using this.
   *
   * @param projectId
   * @param collectionId
   */
  static async createFromBonadocsApi(projectId: number, collectionId: number) {
    const api = getApi()
    const collectionData = await api.getCollectionData(projectId, collectionId)
    if (!collectionData?.id) {
      throw Error('Failed to load collection data from the API')
    }

    // const store = await getCollectionStore(collectionData.id)
    // const localDataSnapshot = await store.get('data')
    const collection = this.createFromSnapshot(collectionData)
    collection.manager.setProjectId(projectId)
    collection.manager.setCollectionId(collectionId)
    await collection.manager.saveToLocal()
    return collection
  }

  static async createFromProtocolRegistry(slug: string) {
    if (!slug) {
      throw Error('Invalid protocol slug')
    }

    const metadata = await loadProtocolMetadata(slug)
    if (!metadata) {
      throw Error(`Failed to load protocol metadata for ${slug}`)
    }

    return this.createFromURI(metadata.collection)
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

      return this.createFromSnapshot(responseData as CollectionDataSnapshot)
    }

    throw Error('Invalid URI')
  }

  /**
   * Loads a collection from a JSON snapshot.
   * @param snapshot
   */
  static createFromSnapshot(snapshot: CollectionDataSnapshot) {
    const data =
      typeof snapshot === 'string'
        ? JSON.parse(snapshot, jsonUtils.reviver)
        : snapshot
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
    const snapshot = await store.getString('data')
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
