import { getCodeRunner } from '../../../codesandbox'
import { getDefaultLibraries } from '../../execution/util'
import { CodeSnippetLanguage } from '../../spec'
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

  async addLibrary(language: CodeSnippetLanguage, library: string) {
    const languageLibraries = this.getLibraries(language)
    languageLibraries.push(library)

    await this.setString(
      `libraries.${language}`,
      JSON.stringify(Array.from(new Set(languageLibraries))),
    )

    // preload library asynchronously
    getCodeRunner(language)
      .then((r) => r.loadLibrary(library))
      .catch((e) => {
        console.error(`Failed to pre-load library "${library}"`, e)
      })
  }

  async removeLibrary(language: CodeSnippetLanguage, library: string) {
    const languageLibraries = this.getLibraries(language)
    const index = languageLibraries.indexOf(library)
    if (index !== -1) {
      languageLibraries.splice(index, 1)
    }

    await this.setString(
      `libraries.${language}`,
      JSON.stringify(languageLibraries),
    )
  }

  getLibraries(language: CodeSnippetLanguage): string[] {
    const libraries = this.getString(`libraries.${language}`)
    if (!libraries) {
      return getDefaultLibraries(language)
    }
    return JSON.parse(libraries)
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
