import { FunctionFragment } from 'ethers'

import { BonadocsError } from '../../errors'
import { saveToIPFS } from '../../ipfs'
import { getCollectionStore } from '../../storage'
import { jsonUtils } from '../../util'
import { Event, EventEmitter, EventListener, EventType } from '../events'
import { CollectionData, validateCollection } from '../spec'

import { registerDataUpdateListeners } from './events'
import {
  CollectionEnvironmentManagerView,
  CollectionMetadataView,
  ContractDetailsView,
  ContractManagerView,
  FunctionFragmentView,
  ValueManagerView,
} from './views'
export class CollectionDataManager {
  readonly #data: CollectionData
  readonly #eventEmitter: EventEmitter
  #environmentManagerView: CollectionEnvironmentManagerView | undefined
  #metadataView: CollectionMetadataView | undefined
  #contractManagerView: ContractManagerView | undefined
  #valueManagerView: ValueManagerView | undefined
  #contractDetailsViews = new Map<string, ContractDetailsView>()
  #functionFragmentViews = new Map<string, Map<string, FunctionFragmentView>>()

  constructor(data: CollectionData) {
    this.#data = data
    this.#eventEmitter = new EventEmitter()
    this.setupEventListeners()
  }

  async emit<TEvent extends EventType, TEventData>(
    event: Event<TEvent, TEventData>,
  ) {
    await this.#eventEmitter.emit(event)
  }

  async saveToLocal() {
    const collectionStore = await getCollectionStore(
      this.data.id,
      this.data.name,
    )
    await collectionStore.set(
      'data',
      JSON.stringify(this.data, jsonUtils.replacer),
    )
  }

  /**
   * Saves the collection to IPFS and returns the IPFS URI
   */
  publishToIPFS(): Promise<string> {
    const result = validateCollection(this.#data)
    if (!result.status) {
      throw new BonadocsError(result)
    }

    return saveToIPFS(JSON.stringify(this.#data))
  }

  /**
   * Generates a JSON snapshot of the collection data.
   */
  getSnapshot(): string {
    return JSON.stringify(this.#data, jsonUtils.replacer)
  }

  on<TEvent extends EventType, TEventData>(
    type: TEvent,
    listener: EventListener<TEvent, TEventData>,
  ) {
    this.#eventEmitter.on(type, listener)
  }

  get id() {
    return this.#data.id
  }

  /**
   * Exposes the collection data. This should only be used in view classes for consistency.
   * Modifying the collection data directly will not trigger events and will break functionality.
   */
  get data() {
    return this.#data
  }

  get environmentManagerView() {
    if (!this.#environmentManagerView) {
      this.#environmentManagerView = new CollectionEnvironmentManagerView(this)
    }
    return this.#environmentManagerView
  }

  get metadataView() {
    if (!this.#metadataView) {
      this.#metadataView = new CollectionMetadataView(this)
    }
    return this.#metadataView
  }

  get contractManagerView() {
    if (!this.#contractManagerView) {
      this.#contractManagerView = new ContractManagerView(this)
    }
    return this.#contractManagerView
  }

  get valueManagerView() {
    if (!this.#valueManagerView) {
      this.#valueManagerView = new ValueManagerView(this)
    }
    return this.#valueManagerView
  }

  getContractDetailsView(contractId: string) {
    let view = this.#contractDetailsViews.get(contractId)
    if (!view) {
      view = new ContractDetailsView(this, contractId)
      this.#contractDetailsViews.set(contractId, view)
    }
    return view
  }

  async getFunctionFragmentView(contractId: string, fragmentKey: string) {
    let contractViews = this.#functionFragmentViews.get(contractId)
    if (!contractViews) {
      contractViews = new Map<string, FunctionFragmentView>()
      this.#functionFragmentViews.set(contractId, contractViews)
    }

    let view = contractViews.get(fragmentKey)
    if (!view) {
      view = await this.createFunctionFragmentView(contractId, fragmentKey)
      if (view) {
        contractViews.set(fragmentKey, view)
      }
    }

    return view
  }

  async dropFunctionFragmentView(contractId: string, fragmentKey: string) {
    const contractViews = this.#functionFragmentViews.get(contractId)
    if (!contractViews) {
      return
    }

    await contractViews.get(fragmentKey)?.clear()
    contractViews.delete(fragmentKey)
  }

  private async createFunctionFragmentView(
    contractId: string,
    fragmentKey: string,
  ) {
    const contractDetailsView = this.getContractDetailsView(contractId)
    const fragment = contractDetailsView.getFragment(fragmentKey)
    if (fragment?.fragment instanceof FunctionFragment) {
      return FunctionFragmentView.create(
        this.valueManagerView,
        fragmentKey,
        fragment.fragment,
      )
    }

    return undefined
  }

  /**
   * Registers the data update listeners.
   * @private
   */
  private setupEventListeners() {
    registerDataUpdateListeners(this.#eventEmitter, this.#data)
    this.setupUpdatePersistence()
  }

  /**
   * Persists the collection data to storage on every event.
   * Wildcard listeners are executed after the specific event listeners.
   * @private
   */
  private setupUpdatePersistence() {
    const saveToLocal = this.saveToLocal.bind(this)
    this.#eventEmitter.on('*', {
      process() {
        return saveToLocal()
      },
      async undo() {
        return saveToLocal()
      },
    })
  }
}
