import { httpGet } from '../api'
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

export * from './data-manager'
export * from './execution'
export * from './simulation'
export * from './types'
export * from './spec'

export class Collection {
  #data!: CollectionData
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
  }

  /**
   * Create a new collection with the given name and description.
   * @param name
   * @param description
   * @param overrides
   */
  static createBlankCollection(
    name: string,
    description: string,
    overrides?: Partial<CollectionData>,
  ): Collection {
    const collection = new Collection(name, description)
    collection.#data = {
      // the id will be set by automerge
      id: '',
      name,
      description,
      strings: {},
      contractInterfaces: [],
      links: [],
      variables: [],
      contracts: [],
      workflows: [],
      ...overrides,
    }
    return collection
  }

  /**
   * Loads a collection from IPFS.
   * @param uri
   */
  static async createFromIPFS(uri: string): Promise<Collection> {
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
  static async createFromBonadocsApi(
    projectId: number,
    collectionId: number,
  ): Promise<Collection> {
    const manager = await CollectionDataManager.create(null, {
      projectId,
      collectionId,
    })
    // ensure the data is loaded
    const data = await manager.getData()

    const collection = new Collection(data.name, data.description)
    collection.#manager = manager

    return collection
  }

  static async createFromProtocolRegistry(slug: string): Promise<Collection> {
    if (!slug) {
      throw Error('Invalid protocol slug')
    }

    const metadata = await loadProtocolMetadata(slug)
    if (!metadata) {
      throw Error(`Failed to load protocol metadata for ${slug}`)
    }

    return this.createFromURI(metadata.collection)
  }

  static async createFromURI(uri: string): Promise<Collection> {
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
   * @param isLocal
   */
  static async createFromSnapshot(
    snapshot: CollectionDataSnapshot,
    isLocal = false,
  ): Promise<Collection> {
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

    const manager = await CollectionDataManager.create(
      data,
      undefined,
      !isLocal,
    )
    collection.#manager = manager

    const store = await getCollectionStore(manager.id)
    await store.set(
      'data',
      JSON.stringify(await manager.getData(), jsonUtils.replacer),
    )
    return collection
  }

  static async createFromLocalStore(id: string): Promise<Collection> {
    const store = await getCollectionStore(id)
    const snapshot = await store.getString('data')
    if (!snapshot) {
      throw new Error(`Collection ${id} not found`)
    }
    return this.createFromSnapshot(snapshot, true)
  }

  /**
   * Returns the collection data manager
   */
  async getManager(): Promise<CollectionDataManager> {
    if (!this.#manager) {
      this.#manager = await CollectionDataManager.create(
        this.#data,
        undefined,
        true,
      )
    }
    return this.#manager
  }
}
