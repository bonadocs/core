import { CollectionDataManager } from '../'
import { Link } from '../../spec'
import {
  AddCollectionLinkEvent,
  RemoveCollectionLinkEvent,
  RenameCollectionEvent,
  UpdateCollectionDescriptionEvent,
} from '../events'

import { CallbackListener, createEventListener } from './util'

export class CollectionMetadataView {
  readonly #dataManager: CollectionDataManager
  #onRename: CallbackListener
  #onDescriptionUpdated: CallbackListener
  #onLinkAdded: CallbackListener
  #onLinkRemoved: CallbackListener

  constructor(dataManager: CollectionDataManager) {
    this.#dataManager = dataManager
    this.setupEventListeners()
  }

  async getName() {
    const data = await this.#dataManager.getData()
    return data.name
  }

  async getDescription() {
    const data = await this.#dataManager.getData()
    return data.description
  }

  async getLinks(): Promise<readonly Link[]> {
    const data = await this.#dataManager.getData()
    return data.links
  }

  async rename(name: string) {
    const event: RenameCollectionEvent = {
      type: 'collection:rename',
      data: {
        collectionId: this.#dataManager.id,
        name,
      },
    }
    await this.#dataManager.emit(event)
  }

  async updateDescription(description: string) {
    const event: UpdateCollectionDescriptionEvent = {
      type: 'collection:update-description',
      data: {
        collectionId: this.#dataManager.id,
        description,
      },
    }

    await this.#dataManager.emit(event)
  }

  async addLink(link: Link) {
    const event: AddCollectionLinkEvent = {
      type: 'collection:add-link',
      data: {
        collectionId: this.#dataManager.id,
        link,
      },
    }

    await this.#dataManager.emit(event)
  }

  async removeLink(url: string) {
    const event: RemoveCollectionLinkEvent = {
      type: 'collection:remove-link',
      data: {
        collectionId: this.#dataManager.id,
        url,
      },
    }

    await this.#dataManager.emit(event)
  }

  onRename(callback: CallbackListener) {
    this.#onRename = callback
  }

  onDescriptionUpdated(callback: CallbackListener) {
    this.#onDescriptionUpdated = callback
  }

  onLinkAdded(callback: CallbackListener) {
    this.#onLinkAdded = callback
  }

  onLinkRemoved(callback: CallbackListener) {
    this.#onLinkRemoved = callback
  }

  private setupEventListeners() {
    this.#dataManager.on(
      'collection:rename',
      createEventListener(() => this.#onRename),
    )
    this.#dataManager.on(
      'collection:update-description',
      createEventListener(() => this.#onDescriptionUpdated),
    )
    this.#dataManager.on(
      'collection:add-link',
      createEventListener(() => this.#onLinkAdded),
    )
    this.#dataManager.on(
      'collection:remove-link',
      createEventListener(() => this.#onLinkRemoved),
    )
  }
}
