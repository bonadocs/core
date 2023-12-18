import { getCollectionStore } from '../../storage'
import { jsonUtils } from '../../util'
import { Event, EventEmitter, EventListener, EventType } from '../events'
import { CollectionData } from '../spec'

import { registerDataUpdateListeners } from './events'
export class CollectionDataManager {
  readonly #data: CollectionData
  readonly #eventEmitter: EventEmitter

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
    const data = this.#data
    this.#eventEmitter.on('*', {
      async process() {
        const collectionStore = await getCollectionStore(data.id, data.name)
        await collectionStore.set(
          'data',
          JSON.stringify(data, jsonUtils.replacer),
        )
      },
      async undo() {
        const collectionStore = await getCollectionStore(data.id, data.name)
        await collectionStore.set(
          'data',
          JSON.stringify(data, jsonUtils.replacer),
        )
      },
    })
  }
}
