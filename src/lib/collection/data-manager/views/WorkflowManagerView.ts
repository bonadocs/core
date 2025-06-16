import {
  CollectionDataManager,
  DeleteCollectionWorkflowCodeEvent,
  SetCollectionWorkflowCodeEvent,
  ValueManagerView,
} from '../'
import { saveToIPFS } from '../../../ipfs'
import {
  CodeSnippet,
  CodeSnippetLanguage,
  WorkflowDefinition,
} from '../../spec'
import { generateRandomId } from '../../util'
import {
  AddCollectionWorkflowEvent,
  AddCollectionWorkflowFunctionEvent,
  AddCollectionWorkflowVariableEvent,
  RemoveCollectionWorkflowEvent,
  RemoveCollectionWorkflowFunctionEvent,
  RemoveCollectionWorkflowVariableEvent,
  RenameCollectionWorkflowEvent,
  RenameCollectionWorkflowVariableEvent,
} from '../events'

import { CallbackListener, createEventListener } from './util'

export class WorkflowManagerView {
  readonly #dataManager: CollectionDataManager
  readonly #valueManagerView: ValueManagerView
  readonly #workflowDefinitions: Map<string, WorkflowDefinition>
  readonly #workflowVariables: Map<string, Map<string, string>>

  #onWorkflowAdded: CallbackListener
  #onWorkflowRemoved: CallbackListener
  #onWorkflowRenamed: CallbackListener
  #onWorkflowVariableAdded: CallbackListener
  #onWorkflowVariableRemoved: CallbackListener
  #onWorkflowVariableRenamed: CallbackListener
  #onWorkflowFunctionAdded: CallbackListener
  #onWorkflowFunctionRemoved: CallbackListener
  #onWorkflowCodeSet: CallbackListener
  #onWorkflowCodeDeleted: CallbackListener
  #onCollectionUpdated: CallbackListener

  private constructor(
    valueManagerView: ValueManagerView,
    dataManager: CollectionDataManager,
  ) {
    this.#valueManagerView = valueManagerView
    this.#dataManager = dataManager
    this.#workflowDefinitions = new Map()
    this.#workflowVariables = new Map()
  }

  static async create(
    valueManagerView: ValueManagerView,
    dataManager: CollectionDataManager,
  ) {
    const view = new WorkflowManagerView(valueManagerView, dataManager)
    view.setupEventListeners()
    await view.resetInternalDataStructures()

    view.#onCollectionUpdated = () => {
      view.resetInternalDataStructures().catch((e) => {
        console.error(
          `[${WorkflowManagerView.name}], Failed to reset internal data structures:`,
          e,
        )
      })
    }
    return view
  }

  getWorkflowVariable(workflowId: string, variableName: string) {
    return this.#workflowVariables.get(workflowId)?.get(variableName)
  }

  getWorkflow(id: string) {
    return this.#workflowDefinitions.get(id)
  }

  get workflows() {
    return this.#workflowDefinitions.values()
  }

  /**
   * Generates a widget from the workflow and
   * returns the IPFS URI. If no workflowId is
   * provided, the generated widget will be
   * open ended and arbitrary functions
   * can be provided at runtime as long as
   * they are in the collection.
   *
   * @param workflowId
   */
  async generateWidget(workflowId: string): Promise<string> {
    if (!workflowId) {
      throw new Error('Workflow ID is required')
    }

    const collectionURI = await this.#dataManager.publishToIPFS()
    const workflow = this.#workflowDefinitions.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found`)
    }

    const widgetConfig = {
      collectionURI,
      execution: workflow.execution,
    }
    return saveToIPFS(JSON.stringify(widgetConfig))
  }

  /**
   * Generates a widget from the workflow and
   * returns the IPFS URI. If no workflowId is
   * provided, the generated widget will
   * include the workflow execution context.
   *
   * @param workflowId
   */
  async generateIPFSWidget(workflowId: string): Promise<string> {
    if (!workflowId) {
      throw new Error('Workflow ID is required')
    }

    const collectionURI = await this.#dataManager.publishToIPFS()
    const workflow = this.#workflowDefinitions.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found`)
    }

    const widgetConfig = {
      collectionURI,
      execution: workflow.execution,
    }
    return saveToIPFS(JSON.stringify(widgetConfig))
  }

  async addWorkflow(workflow: WorkflowDefinition) {
    if (!workflow.id) {
      workflow.id = generateRandomId()
    }
    const addWorkflowEvent: AddCollectionWorkflowEvent = {
      type: 'collection:add-workflow',
      data: {
        collectionId: this.#dataManager.id,
        workflow,
      },
    }

    await this.#dataManager.emit(addWorkflowEvent)
    return workflow.id
  }

  async removeWorkflow(workflowId: string) {
    const event: RemoveCollectionWorkflowEvent = {
      type: 'collection:remove-workflow',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
      },
    }

    await this.#dataManager.emit(event)
  }

  async renameWorkflow(workflowId: string, name: string) {
    const event: RenameCollectionWorkflowEvent = {
      type: 'collection:rename-workflow',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        name,
      },
    }

    await this.#dataManager.emit(event)
  }

  async addWorkflowVariable(workflowId: string, name: string, value: string) {
    const event: AddCollectionWorkflowVariableEvent = {
      type: 'collection:add-workflow-variable',
      data: {
        collectionId: this.#dataManager.id,
        workflowId: workflowId,
        variable: {
          name,
          value,
        },
      },
    }

    await this.#dataManager.emit(event)
  }

  async removeWorkflowVariable(workflowId: string, name: string) {
    const event: RemoveCollectionWorkflowVariableEvent = {
      type: 'collection:remove-workflow-variable',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        name,
      },
    }

    await this.#dataManager.emit(event)
  }

  async renameWorkflowVariable(
    workflowId: string,
    oldName: string,
    newName: string,
  ) {
    const event: RenameCollectionWorkflowVariableEvent = {
      type: 'collection:rename-workflow-variable',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        oldName,
        newName,
      },
    }

    await this.#dataManager.emit(event)
  }

  async setDocText(workflowId: string, text: string) {
    const fullKey = `docs::workflows::${workflowId}::text`
    await this.#valueManagerView.setString(fullKey, text)
  }

  async getDocText(workflowId: string) {
    const fullKey = `docs::workflows::${workflowId}::text`
    return this.#valueManagerView.getString(fullKey)
  }

  async addWorkflowFunction(workflowId: string, functionKey: string) {
    const contractManager = await this.#dataManager.getContractManagerView()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [contractId, _, fragmentKey] = functionKey.split('.')
    const contract = contractManager.getContract(contractId)
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found`)
    }

    const contractInterface = contractManager.getInterface(
      contract?.interfaceHash,
    )

    if (!contractInterface) {
      throw new Error(
        `Contract interface '${contract.interfaceHash}' not found`,
      )
    }

    if (!contractInterface.getFunction(fragmentKey)) {
      throw new Error(`Function '${fragmentKey}' not found`)
    }

    const event: AddCollectionWorkflowFunctionEvent = {
      type: 'collection:add-workflow-function',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        functionKey,
      },
    }

    await this.#dataManager.emit(event)
  }

  async removeWorkflowFunction(workflowId: string, functionKey: string) {
    const event: RemoveCollectionWorkflowFunctionEvent = {
      type: 'collection:remove-workflow-function',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        functionKey,
      },
    }

    await this.#dataManager.emit(event)
  }

  async setWorkflowCode(
    workflowId: string,
    language: CodeSnippetLanguage,
    code: string,
  ) {
    const event: SetCollectionWorkflowCodeEvent = {
      type: 'collection:set-workflow-code',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        language,
        code,
      },
    }

    await this.#dataManager.emit(event)
  }

  async deleteWorkflowCode(workflowId: string, language: CodeSnippetLanguage) {
    const event: DeleteCollectionWorkflowCodeEvent = {
      type: 'collection:delete-workflow-code',
      data: {
        collectionId: this.#dataManager.id,
        workflowId,
        language,
      },
    }

    await this.#dataManager.emit(event)
  }

  onWorkflowAdded(callback: CallbackListener) {
    this.#onWorkflowAdded = callback
  }

  onWorkflowRemoved(callback: CallbackListener) {
    this.#onWorkflowRemoved = callback
  }

  onWorkflowRenamed(callback: CallbackListener) {
    this.#onWorkflowRenamed = callback
  }

  onWorkflowVariableAdded(callback: CallbackListener) {
    this.#onWorkflowFunctionAdded = callback
  }

  onWorkflowVariableRemoved(callback: CallbackListener) {
    this.#onWorkflowVariableRemoved = callback
  }

  onWorkflowVariableRenamed(callback: CallbackListener) {
    this.#onWorkflowVariableRenamed = callback
  }

  onWorkflowFunctionAdded(callback: CallbackListener) {
    this.#onWorkflowFunctionAdded = callback
  }

  onWorkflowFunctionRemoved(callback: CallbackListener) {
    this.#onWorkflowFunctionRemoved = callback
  }

  onWorkflowCodeSet(callback: CallbackListener) {
    this.#onWorkflowCodeSet = callback
  }

  onWorkflowCodeDeleted(callback: CallbackListener) {
    this.#onWorkflowCodeDeleted = callback
  }

  private setupEventListeners() {
    this.setupViewDataUpdateListeners()
    this.setupCallbackEventListeners()
  }

  private async resetInternalDataStructures() {
    this.#workflowVariables.clear()
    this.#workflowDefinitions.clear()

    const data = await this.#dataManager.getData()
    for (const workflow of data.workflows) {
      this.#workflowDefinitions.set(workflow.id, workflow)
      const workflowVariables = new Map<string, string>()
      this.#workflowVariables.set(workflow.id, workflowVariables)
      for (const variable of workflow.variables) {
        workflowVariables.set(variable.name, variable.value)
      }
    }
  }

  private setupViewDataUpdateListeners() {
    const workflowDefinitions = this.#workflowDefinitions
    const workflowVariables = this.#workflowVariables
    const resetInternalDataStructures =
      this.resetInternalDataStructures.bind(this)
    this.#dataManager.on('collection:add-workflow-variable', {
      process(event: AddCollectionWorkflowVariableEvent): void | Promise<void> {
        const map = workflowVariables.get(event.data.workflowId)
        if (map) {
          map.set(event.data.variable.name, event.data.variable.value)
        }
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-workflow-variable', {
      process(
        event: RemoveCollectionWorkflowVariableEvent,
      ): void | Promise<void> {
        const map = workflowVariables.get(event.data.workflowId)
        if (map) {
          map.delete(event.data.name)
        }
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:rename-workflow-variable', {
      process(
        event: RenameCollectionWorkflowVariableEvent,
      ): void | Promise<void> {
        const map = workflowVariables.get(event.data.workflowId)
        if (map) {
          const value = map.get(event.data.oldName)
          if (value) {
            map.delete(event.data.oldName)
            map.set(event.data.newName, value)
          }
        }
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:add-workflow', {
      process(event: AddCollectionWorkflowEvent): void | Promise<void> {
        workflowDefinitions.set(event.data.workflow.id, event.data.workflow)
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:remove-workflow', {
      process(event: RemoveCollectionWorkflowEvent): void | Promise<void> {
        workflowDefinitions.delete(event.data.workflowId)
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:set-workflow-code', {
      process(event: SetCollectionWorkflowCodeEvent): void | Promise<void> {
        const workflow = workflowDefinitions.get(event.data.workflowId)
        if (!workflow?.execution || typeof workflow.execution[0] === 'string') {
          return
        }

        const execution = workflow.execution as CodeSnippet[]
        const snippet = execution.find(
          (x): x is CodeSnippet =>
            (x as CodeSnippet).language === event.data.language,
        )
        if (snippet) {
          snippet.code = event.data.code
        } else {
          execution.push({
            language: event.data.language,
            code: event.data.code,
          })
        }
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
    this.#dataManager.on('collection:delete-workflow-code', {
      process(event: DeleteCollectionWorkflowCodeEvent): void | Promise<void> {
        const workflow = workflowDefinitions.get(event.data.workflowId)
        if (!workflow?.execution || typeof workflow.execution[0] === 'string') {
          return
        }

        const execution = workflow.execution as CodeSnippet[]
        const index = execution.findIndex(
          (x): x is CodeSnippet =>
            (x as CodeSnippet).language === event.data.language,
        )
        if (index >= 0) {
          execution.splice(index, 1)
        }
      },
      async undo(): Promise<void> {
        await resetInternalDataStructures()
      },
    })
  }

  private setupCallbackEventListeners() {
    this.#dataManager.on(
      'collection:add-workflow',
      createEventListener(() => this.#onWorkflowAdded),
    )

    this.#dataManager.on(
      'collection:remove-workflow',
      createEventListener(() => this.#onWorkflowRemoved),
    )

    this.#dataManager.on(
      'collection:rename-workflow',
      createEventListener(() => this.#onWorkflowRenamed),
    )

    this.#dataManager.on(
      'collection:add-workflow-variable',
      createEventListener(() => this.#onWorkflowVariableAdded),
    )

    this.#dataManager.on(
      'collection:remove-workflow-variable',
      createEventListener(() => this.#onWorkflowVariableRemoved),
    )

    this.#dataManager.on(
      'collection:rename-workflow-variable',
      createEventListener(() => this.#onWorkflowVariableRenamed),
    )

    this.#dataManager.on(
      'collection:add-workflow-function',
      createEventListener(() => this.#onWorkflowFunctionAdded),
    )

    this.#dataManager.on(
      'collection:remove-workflow-function',
      createEventListener(() => this.#onWorkflowFunctionRemoved),
    )

    this.#dataManager.on(
      'collection:set-workflow-code',
      createEventListener(() => this.#onWorkflowCodeSet),
    )

    this.#dataManager.on(
      'collection:delete-workflow-code',
      createEventListener(() => this.#onWorkflowCodeDeleted),
    )

    this.#dataManager.on(
      'collection:update',
      createEventListener(() => this.#onCollectionUpdated),
    )
  }
}
