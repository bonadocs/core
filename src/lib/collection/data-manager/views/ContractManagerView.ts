import { Interface } from 'ethers'

import { CollectionDataManager } from '../'
import { ContractDefinition, ContractInterface } from '../../spec'
import {
  AddCollectionContractEvent,
  AddCollectionContractInstanceEvent,
  AddCollectionContractInterfaceEvent,
  RemoveCollectionContractEvent,
  RemoveCollectionContractInstanceEvent,
  RemoveCollectionContractInterfaceEvent,
  RenameCollectionContractEvent,
  RenameCollectionContractInterfaceEvent,
} from '../events'

import { CallbackListener, createEventListener } from './util'

export class ContractManagerView {
  readonly #dataManager: CollectionDataManager
  readonly #contractInterfaces: Map<string, Interface>
  readonly #contractDefinitions: Map<string, ContractDefinition>

  #onContractInterfaceAdded: CallbackListener
  #onContractInterfaceRemoved: CallbackListener
  #onContractInterfaceRenamed: CallbackListener
  #onContractAdded: CallbackListener
  #onContractRemoved: CallbackListener
  #onContractRenamed: CallbackListener
  #onContractInstanceAdded: CallbackListener
  #onContractInstanceRemoved: CallbackListener

  constructor(dataManager: CollectionDataManager) {
    this.#dataManager = dataManager
    this.#contractDefinitions = new Map<string, ContractDefinition>()
    this.#contractInterfaces = new Map<string, Interface>()
    this.setupEventListeners()
  }

  getInterface(hash: string) {
    return this.#contractInterfaces.get(hash)
  }

  getContract(id: string) {
    return this.#contractDefinitions.get(id)
  }

  async addContractInterface(contractInterface: ContractInterface) {
    const event: AddCollectionContractInterfaceEvent = {
      type: 'collection:add-contract-interface',
      data: {
        collectionId: this.#dataManager.id,
        contractInterface,
      },
    }

    await this.#dataManager.emit(event)
  }

  async removeContractInterface(contractInterfaceHash: string) {
    const event: RemoveCollectionContractInterfaceEvent = {
      type: 'collection:remove-contract-interface',
      data: {
        collectionId: this.#dataManager.id,
        contractInterfaceHash,
      },
    }

    await this.#dataManager.emit(event)
  }

  async renameContractInterface(contractInterfaceHash: string, name: string) {
    const event: RenameCollectionContractInterfaceEvent = {
      type: 'collection:rename-contract-interface',
      data: {
        collectionId: this.#dataManager.id,
        contractInterfaceHash,
        name,
      },
    }

    await this.#dataManager.emit(event)
  }

  async addContract(
    contract: ContractDefinition,
    chainId: number,
    address: string,
  ) {
    const addContractEvent: AddCollectionContractEvent = {
      type: 'collection:add-contract',
      data: {
        collectionId: this.#dataManager.id,
        contract,
      },
    }

    const addContractInstanceEvent: AddCollectionContractInstanceEvent = {
      type: 'collection:add-contract-instance',
      data: {
        collectionId: this.#dataManager.id,
        contractId: contract.id,
        chainId,
        address,
      },
    }

    await this.#dataManager.emit(addContractEvent)
    await this.#dataManager.emit(addContractInstanceEvent)
  }

  async removeContract(contractId: string) {
    const event: RemoveCollectionContractEvent = {
      type: 'collection:remove-contract',
      data: {
        collectionId: this.#dataManager.id,
        contractId,
      },
    }

    await this.#dataManager.emit(event)
  }

  async renameContract(contractId: string, name: string) {
    const event: RenameCollectionContractEvent = {
      type: 'collection:rename-contract',
      data: {
        collectionId: this.#dataManager.id,
        contractId,
        name,
      },
    }

    await this.#dataManager.emit(event)
  }

  async addContractInstance(
    contractId: string,
    chainId: number,
    address: string,
  ) {
    const event: AddCollectionContractInstanceEvent = {
      type: 'collection:add-contract-instance',
      data: {
        collectionId: this.#dataManager.id,
        contractId,
        chainId,
        address,
      },
    }

    await this.#dataManager.emit(event)
  }

  async removeContractInstance(
    contractId: string,
    chainId: number,
    address: string,
  ) {
    const event: RemoveCollectionContractInstanceEvent = {
      type: 'collection:remove-contract-instance',
      data: {
        collectionId: this.#dataManager.id,
        contractId,
        chainId,
        address,
      },
    }

    await this.#dataManager.emit(event)
  }

  onContractInterfaceAdded(callback: CallbackListener) {
    this.#onContractInstanceAdded = callback
  }

  onContractInterfaceRemoved(callback: CallbackListener) {
    this.#onContractInterfaceRemoved = callback
  }

  onContractInterfaceRenamed(callback: CallbackListener) {
    this.#onContractInterfaceRenamed = callback
  }

  onContractAdded(callback: CallbackListener) {
    this.#onContractAdded = callback
  }

  onContractRemoved(callback: CallbackListener) {
    this.#onContractRemoved = callback
  }

  onContractRenamed(callback: CallbackListener) {
    this.#onContractRenamed = callback
  }

  onContractInstanceAdded(callback: CallbackListener) {
    this.#onContractInstanceAdded = callback
  }

  onContractInstanceRemoved(callback: CallbackListener) {
    this.#onContractInstanceRemoved = callback
  }

  private setupEventListeners() {
    this.setupViewDataUpdateListeners()
    this.setupCallbackEventListeners()
  }

  private resetInternalDataStructures() {
    this.#contractInterfaces.clear()
    this.#contractDefinitions.clear()

    for (const contractInterface of this.#dataManager.data.contractInterfaces) {
      this.#contractInterfaces.set(
        contractInterface.hash,
        new Interface(contractInterface.abi),
      )
    }

    for (const contract of this.#dataManager.data.contracts) {
      this.#contractDefinitions.set(contract.id, contract)
    }
  }

  private setupViewDataUpdateListeners() {
    const contractDefinitions = this.#contractDefinitions
    const contractInterfaces = this.#contractInterfaces
    const resetInternalDataStructures =
      this.resetInternalDataStructures.bind(this)
    this.#dataManager.on('collection:add-contract-interface', {
      process(
        event: AddCollectionContractInterfaceEvent,
      ): void | Promise<void> {
        contractInterfaces.set(
          event.data.contractInterface.hash,
          new Interface(event.data.contractInterface.abi),
        )
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-contract-interface', {
      process(
        event: RemoveCollectionContractInterfaceEvent,
      ): void | Promise<void> {
        contractInterfaces.delete(event.data.contractInterfaceHash)
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:add-contract', {
      process(event: AddCollectionContractEvent): void | Promise<void> {
        contractDefinitions.set(event.data.contract.id, event.data.contract)
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-contract', {
      process(event: RemoveCollectionContractEvent): void | Promise<void> {
        contractDefinitions.delete(event.data.contractId)
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:rename-contract', {
      process(event: RenameCollectionContractEvent): void | Promise<void> {
        const contract = contractDefinitions.get(event.data.contractId)
        if (contract) {
          contract.name = event.data.name
        }
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:add-contract-instance', {
      process(event: AddCollectionContractInstanceEvent): void | Promise<void> {
        const contract = contractDefinitions.get(event.data.contractId)
        if (contract) {
          contract.instances.push({
            chainId: event.data.chainId,
            address: event.data.address,
          })
        }
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-contract-instance', {
      process(
        event: RemoveCollectionContractInstanceEvent,
      ): void | Promise<void> {
        const contract = contractDefinitions.get(event.data.contractId)
        if (contract) {
          const index = contract.instances.findIndex(
            (instance) =>
              instance.chainId === event.data.chainId &&
              instance.address === event.data.address,
          )
          if (index !== -1) {
            contract.instances.splice(index, 1)
          }
        }
      },
      undo(): void | Promise<void> {
        resetInternalDataStructures()
      },
    })
  }

  private setupCallbackEventListeners() {
    this.#dataManager.on(
      'collection:add-contract-interface',
      createEventListener(() => this.#onContractInterfaceAdded),
    )

    this.#dataManager.on(
      'collection:remove-contract-interface',
      createEventListener(() => this.#onContractInterfaceRemoved),
    )

    this.#dataManager.on(
      'collection:rename-contract-interface',
      createEventListener(() => this.#onContractInterfaceRenamed),
    )

    this.#dataManager.on(
      'collection:add-contract',
      createEventListener(() => this.#onContractAdded),
    )

    this.#dataManager.on(
      'collection:remove-contract',
      createEventListener(() => this.#onContractRemoved),
    )

    this.#dataManager.on(
      'collection:rename-contract',
      createEventListener(() => this.#onContractRenamed),
    )

    this.#dataManager.on(
      'collection:add-contract-instance',
      createEventListener(() => this.#onContractInstanceAdded),
    )

    this.#dataManager.on(
      'collection:remove-contract-instance',
      createEventListener(() => this.#onContractInstanceRemoved),
    )
  }
}
