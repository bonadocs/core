import { CollectionDataManager } from '../'
import {
  AddCollectionVariableEvent,
  RemoveCollectionVariableEvent,
  RenameCollectionVariableEvent,
} from '../events'

import { CallbackListener, createEventListener } from './util'

export class CollectionEnvironmentManagerView {
  readonly #dataManager: CollectionDataManager
  #onVariableAdded: CallbackListener
  #onVariableRemoved: CallbackListener
  #onVariableRenamed: CallbackListener

  // view state - managed internally for efficient data access
  readonly #variableMap: Map<string, string>

  constructor(dataManager: CollectionDataManager) {
    this.#dataManager = dataManager
    this.#variableMap = new Map<string, string>()
    this.resetInternalDataStructures()
    this.setupEventListeners()
  }

  get list() {
    return this.#variableMap.entries()
  }

  getVariable(name: string) {
    return this.#variableMap.get(name)
  }

  async setVariable(name: string, value: string) {
    const event: AddCollectionVariableEvent = {
      type: 'collection:add-variable',
      data: {
        collectionId: this.#dataManager.id,
        variable: {
          name,
          value,
        },
      },
    }

    await this.#dataManager.emit(event)
  }

  async renameVariable(oldName: string, newName: string) {
    const event: RenameCollectionVariableEvent = {
      type: 'collection:rename-variable',
      data: {
        collectionId: this.#dataManager.id,
        oldName,
        newName,
      },
    }

    await this.#dataManager.emit(event)
  }

  async deleteVariable(name: string) {
    const event: RemoveCollectionVariableEvent = {
      type: 'collection:remove-variable',
      data: {
        collectionId: this.#dataManager.id,
        name,
      },
    }

    await this.#dataManager.emit(event)
  }

  onVariableAdded(callback: CallbackListener) {
    this.#onVariableAdded = callback
  }

  onVariableRemoved(callback: CallbackListener) {
    this.#onVariableRemoved = callback
  }

  onVariableRenamed(callback: CallbackListener) {
    this.#onVariableRenamed = callback
  }

  private setupEventListeners() {
    this.setupViewDataUpdateListeners()
    this.setupCallbackEventListeners()
  }

  private resetInternalDataStructures() {
    this.#variableMap.clear()
    for (const variable of this.#dataManager.data.variables) {
      this.#variableMap.set(variable.name, variable.value)
    }
  }

  private setupViewDataUpdateListeners() {
    const variableMap = this.#variableMap
    const resetInternalDataStructures =
      this.resetInternalDataStructures.bind(this)
    this.#dataManager.on('collection:add-variable', {
      process(event: AddCollectionVariableEvent): void | Promise<void> {
        variableMap.set(event.data.variable.name, event.data.variable.value)
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-variable', {
      process(event: RemoveCollectionVariableEvent): void | Promise<void> {
        variableMap.delete(event.data.name)
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:rename-variable', {
      process(event: RenameCollectionVariableEvent): void | Promise<void> {
        const data = variableMap.get(event.data.oldName)
        if (!data) {
          console.warn(`Variable ${event.data.oldName} not found`)
          return
        }
        variableMap.set(event.data.newName, data)
        variableMap.delete(event.data.oldName)
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
  }

  private setupCallbackEventListeners() {
    this.#dataManager.on(
      'collection:add-variable',
      createEventListener(() => this.#onVariableAdded),
    )
    this.#dataManager.on(
      'collection:remove-variable',
      createEventListener(() => this.#onVariableRemoved),
    )
    this.#dataManager.on(
      'collection:rename-variable',
      createEventListener(() => this.#onVariableRenamed),
    )
  }
}
