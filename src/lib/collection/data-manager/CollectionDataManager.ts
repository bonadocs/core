import { DocHandle, DocumentId, Repo } from '@automerge/automerge-repo'
import { FunctionFragment, sha256, toUtf8Bytes } from 'ethers'

import { getApi } from '../../api'
import { getAutomergeRepo } from '../../automerge'
import { BonadocsError } from '../../errors'
import { saveToIPFS } from '../../ipfs'
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
import { WorkflowManagerView } from './views/WorkflowManagerView'
import { createEventListener } from './views/util'

export class CollectionDataManager {
  readonly #eventEmitter: EventEmitter
  #dataHandle!: DocHandle<CollectionData>

  #environmentManagerView: CollectionEnvironmentManagerView | undefined
  #metadataView: CollectionMetadataView | undefined
  #contractManagerView: ContractManagerView | undefined
  #workflowManagerView: WorkflowManagerView | undefined
  #valueManagerView: ValueManagerView | undefined
  #contractDetailsViews = new Map<string, ContractDetailsView>()
  #functionFragmentViews = new Map<string, Map<string, FunctionFragmentView>>()
  #projectId?: number
  #collectionId?: number
  #dataId!: string

  private constructor(
    automergeRepo: Repo,
    dataOrId: CollectionData | string,
    forceNewDoc: boolean,
  ) {
    this.#eventEmitter = new EventEmitter()
    if (forceNewDoc) {
      this.#dataHandle = automergeRepo.create(dataOrId)
    } else if (typeof dataOrId === 'string') {
      this.#dataHandle = automergeRepo.find(dataOrId as DocumentId)
    } else if (dataOrId.id.trim() !== '') {
      this.#dataHandle = automergeRepo.find(dataOrId.id as DocumentId)
    } else {
      this.#dataHandle = automergeRepo.create(dataOrId)
    }

    this.#dataHandle.on('change', (doc) => {
      this.#eventEmitter.emit({
        type: 'collection:update',
        data: doc,
      })
    })
  }

  static async create(
    dataOrId: CollectionData | string | null,
    projectDetails?: {
      projectId: number
      collectionId: number
    },
    forceNewDoc = false,
  ): Promise<CollectionDataManager> {
    const { repo: automerge, docId } = projectDetails
      ? await getAutomergeRepo(projectDetails)
      : await getAutomergeRepo()

    if (docId) {
      dataOrId = docId
    }

    if (!dataOrId) {
      throw new Error('Failed to load collection')
    }

    const manager = new CollectionDataManager(automerge, dataOrId, forceNewDoc)
    try {
      await manager.#dataHandle.whenReady()
    } catch (e) {
      console.error('Error loading collection data:', e)
      throw new Error('The collection data could not be loaded')
    }

    manager.setupEventListeners()
    await new Promise<void>((resolve) => {
      manager.#dataHandle.change((doc: CollectionData) => {
        doc.id = manager.#dataHandle.documentId
        manager.#dataId = manager.#dataHandle.documentId
        resolve()
      })
    })

    return manager
  }

  async emit<TEvent extends EventType, TEventData>(
    event: Event<TEvent, TEventData>,
  ) {
    await this.#eventEmitter.emit(event)
  }

  /**
   * Creates a new collection on the Bonadocs API.
   *
   * Returns the ID of the new collection.
   *
   * @param projectId
   */
  async createOnBonadocsApi(projectId: number): Promise<number> {
    if (this.#projectId || this.#collectionId) {
      throw new Error('This can only be used to create a new collection.')
    }

    this.#projectId = projectId

    const data = (await this.#dataHandle.doc())!
    const collectionId = await getApi().createCollection(projectId, data)
    if (!collectionId) {
      throw new Error('Failed to create collection on Bonadocs API')
    }

    const { repo, docId } = await getAutomergeRepo({
      projectId,
      collectionId,
    })
    this.#dataHandle = repo.find(docId as DocumentId)

    return collectionId
  }

  /**
   * This generates a widget configuration for the collection. If the collection
   * has been saved previously, it will simply return the same URI.
   */
  async generateCollectionWidget() {
    const collectionURI = await this.publishToIPFS()
    const widgetConfig = {
      collectionURI,
    }
    return saveToIPFS(JSON.stringify(widgetConfig))
  }

  /**
   * Saves the collection to IPFS and returns the IPFS URI
   */
  async publishToIPFS(): Promise<string> {
    const data = await this.#dataHandle.doc()
    const result = validateCollection(data)
    if (!result.status) {
      throw new BonadocsError(result)
    }

    return saveToIPFS(JSON.stringify(data))
  }

  /**
   * Generates a JSON snapshot of the collection data.
   */
  async getSnapshot(): Promise<string> {
    const data = await this.#dataHandle.doc()
    return JSON.stringify(data, jsonUtils.replacer)
  }

  on<TEvent extends EventType, TEventData>(
    type: TEvent,
    listener: EventListener<TEvent, TEventData>,
  ) {
    this.#eventEmitter.on(type, listener)
  }

  onChange(listener: () => void | Promise<void>): void {
    this.on(
      'collection:update',
      createEventListener(() => listener),
    )
  }

  get id(): string {
    return this.#dataId
  }

  /**
   * Exposes the collection data. This should only be used in view classes for
   * consistency. Modifying the collection data directly will not trigger
   * events and will break functionality.
   */
  async getData(): Promise<Readonly<CollectionData>> {
    const data = await this.#dataHandle.doc()
    if (!data) {
      throw new Error('Collection data not found')
    }
    return data
  }

  /**
   * A hash of the snapshot of the collection data.
   */
  async getSnapshotHash(): Promise<string> {
    const snapshot = await this.getSnapshot()
    return sha256(toUtf8Bytes(snapshot))
  }

  async getEnvironmentManagerView(): Promise<CollectionEnvironmentManagerView> {
    if (!this.#environmentManagerView) {
      this.#environmentManagerView =
        await CollectionEnvironmentManagerView.create(this)
    }
    return this.#environmentManagerView
  }

  async getMetadataView(): Promise<CollectionMetadataView> {
    if (!this.#metadataView) {
      this.#metadataView = new CollectionMetadataView(this)
    }
    return this.#metadataView
  }

  async getWorkflowManagerView(): Promise<WorkflowManagerView> {
    if (!this.#workflowManagerView) {
      this.#workflowManagerView = await WorkflowManagerView.create(
        await this.getValueManagerView(),
        this,
      )
    }
    return this.#workflowManagerView
  }

  async getContractManagerView(): Promise<ContractManagerView> {
    if (!this.#contractManagerView) {
      this.#contractManagerView = await ContractManagerView.create(this)
    }
    return this.#contractManagerView
  }

  async getValueManagerView(): Promise<ValueManagerView> {
    if (!this.#valueManagerView) {
      this.#valueManagerView = new ValueManagerView(this)
    }
    return this.#valueManagerView
  }

  async getContractDetailsView(
    contractId: string,
  ): Promise<ContractDetailsView> {
    let view = this.#contractDetailsViews.get(contractId)
    if (!view) {
      view = await ContractDetailsView.create(
        this,
        await this.getValueManagerView(),
        contractId,
      )
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

  async delete() {
    if (this.#projectId || this.#collectionId) {
      throw new Error(
        'Cannot delete a collection that is associated with a project or collection ID.',
      )
    }

    this.#dataHandle.delete()
  }

  private async createFunctionFragmentView(
    contractId: string,
    fragmentKey: string,
  ) {
    const contractDetailsView = await this.getContractDetailsView(contractId)
    const fragment = contractDetailsView.getFragment(fragmentKey)
    if (fragment?.fragment instanceof FunctionFragment) {
      return FunctionFragmentView.create(
        await this.getValueManagerView(),
        await this.getEnvironmentManagerView(),
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
    registerDataUpdateListeners(this.#eventEmitter, this.#dataHandle)
  }
}
