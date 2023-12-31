﻿import {
  ErrorFragment,
  EventFragment,
  FunctionFragment,
  Interface,
} from 'ethers'

import { createEthersInterface } from '../../../util'
import { ContractElementFragment } from '../../types'
import { CollectionDataManager } from '../CollectionDataManager'

export class ContractDetailsView {
  readonly #dataManager: CollectionDataManager
  readonly #fragments: Map<string, ContractElementFragment>
  readonly #contractId: string
  readonly #contractInterface: Interface

  constructor(dataManager: CollectionDataManager, contractId: string) {
    this.#dataManager = dataManager
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

  getFunctionFragment(key: string) {
    const fragment = this.getFragment(key)
    if (fragment?.fragment instanceof FunctionFragment) {
      return fragment
    }

    // not a function fragment
    if (fragment) {
      return undefined
    }

    // key might be a selector or signature
    const fn = this.#contractInterface.getFunction(key)
    if (!fn) {
      return undefined
    }

    return this.getFragment(`${this.#contractId}.function.${fn.selector}`)
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
        contractId: this.#contractId,
        fragmentKey,
        signature: fragment.format('full'),
        fragment,
      })
    }
  }
}
