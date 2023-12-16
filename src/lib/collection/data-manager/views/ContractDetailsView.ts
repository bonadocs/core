import {
  ErrorFragment,
  EventFragment,
  FunctionFragment,
  Interface,
} from 'ethers'

import { ContractElementFragment } from '../../types'
import { CollectionDataManager } from '../CollectionDataManager'

export class ContractDetailsView {
  readonly #dataManager: CollectionDataManager
  readonly #fragments: Map<string, ContractElementFragment>
  readonly #contractId: string

  constructor(dataManager: CollectionDataManager, contractId: string) {
    this.#dataManager = dataManager
    this.#contractId = contractId
    this.#fragments = new Map<string, ContractElementFragment>()
    this.populateInternalDataStructures()
  }

  getFragment(key: string) {
    return this.#fragments.get(key)
  }

  get fragments() {
    return this.#fragments.values()
  }

  private populateInternalDataStructures() {
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

    this.#fragments.clear()
    const interfaceInstance = new Interface(contractInterface.abi)
    for (const fragment of interfaceInstance.fragments) {
      let selector: string
      if (
        fragment instanceof ErrorFragment ||
        fragment instanceof FunctionFragment
      ) {
        selector = fragment.selector
      } else if (fragment instanceof EventFragment) {
        selector = fragment.topicHash
      } else {
        continue
      }

      const fragmentKey = `${this.#contractId}.${fragment.type}.${selector}`
      this.#fragments.set(fragmentKey, {
        contractId: contract.id,
        fragmentKey,
        signature: fragment.format('full'),
        fragment,
      })
    }
  }
}
