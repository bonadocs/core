import { Interface, sha256, toUtf8Bytes } from 'ethers'

import { CollectionDataManager } from '../'
import { createEthersInterface, normalizeABI } from '../../../util'
import { ContractDefinition, ContractInterface } from '../../spec'
import { generateContractId } from '../../util'
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
  readonly #ethersContractInterfaces: Map<string, Interface>
  readonly #contractInterfaces: Map<string, ContractInterface>
  readonly #contractDefinitions: Map<string, ContractDefinition>

  #onContractInterfaceAdded: CallbackListener
  #onContractInterfaceRemoved: CallbackListener
  #onContractInterfaceRenamed: CallbackListener
  #onContractAdded: CallbackListener
  #onContractRemoved: CallbackListener
  #onContractRenamed: CallbackListener
  #onContractInstanceAdded: CallbackListener
  #onContractInstanceRemoved: CallbackListener
  #onCollectionUpdated: CallbackListener

  private constructor(dataManager: CollectionDataManager) {
    this.#dataManager = dataManager
    this.#contractDefinitions = new Map<string, ContractDefinition>()
    this.#contractInterfaces = new Map<string, ContractInterface>()
    this.#ethersContractInterfaces = new Map<string, Interface>()
  }

  static async create(dataManager: CollectionDataManager) {
    const view = new ContractManagerView(dataManager)
    view.setupEventListeners()
    await view.resetInternalDataStructures()

    view.#onCollectionUpdated = () => {
      view.resetInternalDataStructures().catch((e) => {
        console.error(
          `[${ContractManagerView.name}], Failed to reset internal data structures:`,
          e,
        )
      })
    }
    return view
  }

  getInterface(hash: string) {
    return this.#ethersContractInterfaces.get(hash)
  }

  getContractInterface(hash: string) {
    return this.#contractInterfaces.get(hash)
  }

  getContract(id: string) {
    return this.#contractDefinitions.get(id)
  }

  get contracts() {
    return this.#contractDefinitions.values()
  }

  get interfaces() {
    return this.#contractInterfaces.values()
  }

  async addContractInterface(name: string, abi: string) {
    abi = normalizeABI(abi)
    const contractInterface = {
      hash: sha256(toUtf8Bytes(abi)).slice(2),
      abi: abi,
      name: name,
    }
    const event: AddCollectionContractInterfaceEvent = {
      type: 'collection:add-contract-interface',
      data: {
        collectionId: this.#dataManager.id,
        contractInterface,
      },
    }

    await this.#dataManager.emit(event)
    return contractInterface.hash
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
    if (!contract.id) {
      contract.id = generateContractId(
        this.#dataManager.id,
        contract.name,
        contract.interfaceHash,
      )
    }
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
    return contract.id
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

  private async resetInternalDataStructures() {
    this.#ethersContractInterfaces.clear()
    this.#contractInterfaces.clear()
    this.#contractDefinitions.clear()

    const data = await this.#dataManager.getData()
    for (const contractInterface of data.contractInterfaces) {
      this.#ethersContractInterfaces.set(
        contractInterface.hash,
        createEthersInterface(contractInterface.abi),
      )
      this.#contractInterfaces.set(contractInterface.hash, contractInterface)
    }

    for (const contract of data.contracts) {
      this.#contractDefinitions.set(contract.id, contract)
    }
  }

  private setupViewDataUpdateListeners() {
    const contractDefinitions = this.#contractDefinitions
    const ethersContractInterfaces = this.#ethersContractInterfaces
    const contractInterfaces = this.#contractInterfaces
    const resetInternalDataStructures =
      this.resetInternalDataStructures.bind(this)
    this.#dataManager.on('collection:add-contract-interface', {
      process(
        event: AddCollectionContractInterfaceEvent,
      ): void | Promise<void> {
        ethersContractInterfaces.set(
          event.data.contractInterface.hash,
          createEthersInterface(event.data.contractInterface.abi),
        )
        contractInterfaces.set(
          event.data.contractInterface.hash,
          event.data.contractInterface,
        )
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-contract-interface', {
      process(
        event: RemoveCollectionContractInterfaceEvent,
      ): void | Promise<void> {
        ethersContractInterfaces.delete(event.data.contractInterfaceHash)
        contractInterfaces.delete(event.data.contractInterfaceHash)
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:add-contract', {
      process(event: AddCollectionContractEvent): void | Promise<void> {
        contractDefinitions.set(event.data.contract.id, event.data.contract)
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-contract', {
      process(event: RemoveCollectionContractEvent): void | Promise<void> {
        contractDefinitions.delete(event.data.contractId)
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
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

    this.#dataManager.on(
      'collection:update',
      createEventListener(() => this.#onCollectionUpdated),
    )
  }
}
