import { CollectionDataManager } from '../CollectionDataManager'
import {
  DeleteCollectionStringEvent,
  UpdateCollectionStringEvent,
} from '../events'

import { CallbackListener, createEventListener } from './util'

export class ValueManagerView {
  readonly #dataManager: CollectionDataManager
  #onStringUpdated: CallbackListener

  constructor(dataManager: CollectionDataManager) {
    this.#dataManager = dataManager
    this.setupEventListeners()
  }

  getString(key: string) {
    return this.#dataManager.data.strings[key]
  }

  async setString(key: string, value: string) {
    const event: UpdateCollectionStringEvent = {
      type: 'collection:update-string',
      data: {
        collectionId: this.#dataManager.id,
        key,
        value,
      },
    }

    await this.#dataManager.emit(event)
  }

  async deleteString(key: string) {
    const event: DeleteCollectionStringEvent = {
      type: 'collection:delete-string',
      data: {
        collectionId: this.#dataManager.id,
        key,
      },
    }

    await this.#dataManager.emit(event)
  }

  onStringUpdated(callback: CallbackListener) {
    this.#onStringUpdated = callback
  }

  private setupEventListeners() {
    this.#dataManager.on(
      'collection:update-string',
      createEventListener(() => this.#onStringUpdated),
    )
    this.#dataManager.on(
      'collection:delete-string',
      createEventListener(() => this.#onStringUpdated),
    )
  }
}
