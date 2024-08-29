import {
  ErrorFragment,
  EventFragment,
  Fragment,
  FunctionFragment,
  Interface,
} from 'ethers'

import { createEthersInterface } from '../../../util'
import { ContractElementFragment, SupportedFragmentType } from '../../types'
import { CollectionDataManager } from '../CollectionDataManager'

import { ValueManagerView } from './ValueManagerView'

export class ContractDetailsView {
  readonly #dataManager: CollectionDataManager
  readonly #valueManagerView: ValueManagerView
  readonly #fragments: Map<string, ContractElementFragment>
  readonly #contractId: string
  readonly #contractInterface: Interface

  constructor(
    dataManager: CollectionDataManager,
    valueManagerView: ValueManagerView,
    contractId: string,
  ) {
    this.#dataManager = dataManager
    this.#valueManagerView = valueManagerView
    this.#contractId = contractId
    this.#fragments = new Map<string, ContractElementFragment>()
    const contract = this.#dataManager.data.contracts.find(
      (contract) => contract.id === this.#contractId,
    )

    if (!contract) {
      throw new Error(`Contract with id ${this.#contractId} not found`)
    }

    const contractInterface = this.#dataManager.data.contractInterfaces.find(
      (contractInterface) => contractInterface.hash === contract.interfaceHash,
    )

    if (!contractInterface) {
      throw new Error(
        `Contract interface with hash ${contract.interfaceHash} not found`,
      )
    }
    this.#contractInterface = createEthersInterface(contractInterface.abi)
    this.populateInternalDataStructures()
  }

  getFragment(key: string) {
    return this.#fragments.get(key)
  }

  async setDocText(text: string) {
    const fullKey = `docs::contracts::${this.#contractId}::text`
    await this.#valueManagerView.setString(fullKey, text)
  }

  async getDocText() {
    const fullKey = `docs::contracts::${this.#contractId}::text`
    return this.#valueManagerView.getString(fullKey)
  }

  getFunctionFragment(key: string): ContractElementFragment | undefined {
    const normalizedKey = this.normalizeFragmentKey(key)
    if (!normalizedKey) {
      return undefined
    }

    const fragment = this.getFragment(normalizedKey)
    if (!fragment) {
      return undefined
    }

    if (!(fragment.fragment instanceof FunctionFragment)) {
      return undefined
    }

    return fragment
  }

  /**
   * Returns the widget configuration for the given function fragment key.
   * @param key
   */
  async getWidgetConfiguration(key: string) {
    const functionFragment = this.getFunctionFragment(key)
    if (!functionFragment) {
      throw new Error(`Invalid function fragment key: ${key}`)
    }

    const functionKey = functionFragment.fragmentKey
    const widgetConfigUri = await this.#dataManager.generateCollectionWidget()
    return {
      widgetConfigUri,
      contract: this.#contractId,
      functionKey,
    }
  }

  normalizeFragmentKey(key: string): string | undefined {
    const normalizedFragment = this.getFragment(key)

    // already normalized
    if (normalizedFragment) {
      return normalizedFragment.fragmentKey
    }

    // key might be a selector or signature
    const fragment =
      this.#contractInterface.getFunction(key) ||
      this.#contractInterface.getEvent(key) ||
      this.#contractInterface.getError(key)

    if (!fragment || !this.isSupportedFragmentType(fragment)) {
      return undefined
    }

    return this.getFragmentKey(fragment)
  }

  get contractInterface() {
    return this.#contractInterface
  }

  get fragments() {
    return this.#fragments.values()
  }

  get functions() {
    return [...this.#fragments.values()].filter(
      (fragment) => fragment.fragment instanceof FunctionFragment,
    )
  }

  private populateInternalDataStructures() {
    this.#fragments.clear()
    for (const fragment of this.#contractInterface.fragments) {
      if (!this.isSupportedFragmentType(fragment)) {
        continue
      }

      const fragmentKey = this.getFragmentKey(fragment)
      this.#fragments.set(fragmentKey, {
        contractId: this.#contractId,
        fragmentKey,
        signature: fragment.format('full'),
        fragment,
      })
    }
  }

  private getFragmentKey(fragment: SupportedFragmentType): string {
    let selector: string

    if (
      fragment instanceof ErrorFragment ||
      fragment instanceof FunctionFragment
    ) {
      selector = fragment.selector
    } else {
      // if (fragment instanceof EventFragment) {
      selector = fragment.topicHash
    }

    return `${this.#contractId}.${fragment.type}.${selector}`
  }

  private isSupportedFragmentType(
    fragment: Fragment,
  ): fragment is SupportedFragmentType {
    return (
      fragment instanceof FunctionFragment ||
      fragment instanceof EventFragment ||
      fragment instanceof ErrorFragment
    )
  }
}
