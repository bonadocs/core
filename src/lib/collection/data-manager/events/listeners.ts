import { DocHandle } from '@automerge/automerge-repo'
import { Interface } from 'ethers'

import { EventEmitter, EventListener } from '../../events'
import {
  CodeSnippet,
  CollectionData,
  ContractDefinition,
  ContractInterface,
  Link,
  validateContractInterface,
  VariableDefinition,
  WorkflowDefinition,
} from '../../spec'
import { intersect } from '../../util'

import {
  AddCollectionContractEvent,
  AddCollectionContractEventData,
  AddCollectionContractInstanceEvent,
  AddCollectionContractInstanceEventData,
  AddCollectionContractInterfaceEvent,
  AddCollectionContractInterfaceEventData,
  AddCollectionLinkEvent,
  AddCollectionLinkEventData,
  AddCollectionVariableEvent,
  AddCollectionVariableEventData,
  AddCollectionWorkflowEvent,
  AddCollectionWorkflowEventData,
  AddCollectionWorkflowFunctionEvent,
  AddCollectionWorkflowFunctionEventData,
  AddCollectionWorkflowVariableEvent,
  AddCollectionWorkflowVariableEventData,
  DeleteCollectionStringEvent,
  DeleteCollectionStringEventData,
  DeleteCollectionWorkflowCodeEvent,
  DeleteCollectionWorkflowCodeEventData,
  RemoveCollectionContractEvent,
  RemoveCollectionContractEventData,
  RemoveCollectionContractInstanceEvent,
  RemoveCollectionContractInstanceEventData,
  RemoveCollectionContractInterfaceEvent,
  RemoveCollectionContractInterfaceEventData,
  RemoveCollectionLinkEvent,
  RemoveCollectionLinkEventData,
  RemoveCollectionVariableEvent,
  RemoveCollectionVariableEventData,
  RemoveCollectionWorkflowEvent,
  RemoveCollectionWorkflowEventData,
  RemoveCollectionWorkflowFunctionEvent,
  RemoveCollectionWorkflowFunctionEventData,
  RemoveCollectionWorkflowVariableEvent,
  RemoveCollectionWorkflowVariableEventData,
  RenameCollectionContractEvent,
  RenameCollectionContractEventData,
  RenameCollectionContractInterfaceEvent,
  RenameCollectionContractInterfaceEventData,
  RenameCollectionEvent,
  RenameCollectionEventData,
  RenameCollectionVariableEvent,
  RenameCollectionVariableEventData,
  RenameCollectionWorkflowEvent,
  RenameCollectionWorkflowEventData,
  RenameCollectionWorkflowVariableEvent,
  RenameCollectionWorkflowVariableEventData,
  SetCollectionWorkflowCodeEvent,
  SetCollectionWorkflowCodeEventData,
  UpdateCollectionDescriptionEvent,
  UpdateCollectionDescriptionEventData,
  UpdateCollectionStringEvent,
  UpdateCollectionStringEventData,
} from './types'

export function registerDataUpdateListeners(
  eventEmitter: EventEmitter,
  handle: DocHandle<CollectionData>,
) {
  eventEmitter.on(
    'collection:rename',
    new RenameCollectionEventListener(handle),
  )
  eventEmitter.on(
    'collection:update-description',
    new UpdateCollectionDescriptionEventListener(handle),
  )
  eventEmitter.on(
    'collection:update-string',
    new UpdateCollectionStringEventListener(handle),
  )
  eventEmitter.on(
    'collection:delete-string',
    new DeleteCollectionStringEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-link',
    new AddCollectionLinkEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-link',
    new RemoveCollectionLinkEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-contract-interface',
    new AddCollectionContractInterfaceEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-contract-interface',
    new RemoveCollectionContractInterfaceEventListener(handle),
  )
  eventEmitter.on(
    'collection:rename-contract-interface',
    new RenameCollectionContractInterfaceEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-contract',
    new AddCollectionContractEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-contract',
    new RemoveCollectionContractEventListener(handle),
  )
  eventEmitter.on(
    'collection:rename-contract',
    new RenameCollectionContractEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-contract-instance',
    new AddCollectionContractInstanceEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-contract-instance',
    new RemoveCollectionContractInstanceEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-variable',
    new AddCollectionVariableEventListener(handle),
  )
  eventEmitter.on(
    'collection:rename-variable',
    new RenameCollectionVariableEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-variable',
    new RemoveCollectionVariableEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-workflow',
    new AddCollectionWorkflowEventListener(handle),
  )
  eventEmitter.on(
    'collection:rename-workflow',
    new RenameCollectionWorkflowEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-workflow',
    new RemoveCollectionWorkflowEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-workflow-variable',
    new AddCollectionWorkflowVariableEventListener(handle),
  )
  eventEmitter.on(
    'collection:rename-workflow-variable',
    new RenameCollectionWorkflowVariableEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-workflow-variable',
    new RemoveCollectionWorkflowVariableEventListener(handle),
  )
  eventEmitter.on(
    'collection:add-workflow-function',
    new AddCollectionWorkflowFunctionEventListener(handle),
  )
  eventEmitter.on(
    'collection:remove-workflow-function',
    new RemoveCollectionWorkflowFunctionEventListener(handle),
  )
  eventEmitter.on(
    'collection:set-workflow-code',
    new SetWorkflowCodeEventListener(handle),
  )
  eventEmitter.on(
    'collection:delete-workflow-code',
    new DeleteWorkflowCodeEventListener(handle),
  )
}

class UpdateCollectionStringEventListener
  implements
    EventListener<'collection:update-string', UpdateCollectionStringEventData>
{
  private previousValue: string | undefined
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: UpdateCollectionStringEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      this.previousValue = collectionData.strings[event.data.key]
      collectionData.strings[event.data.key] = event.data.value
    })
  }

  async undo(event: UpdateCollectionStringEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousValue === undefined) {
        delete collectionData.strings[event.data.key]
      } else {
        collectionData.strings[event.data.key] = this.previousValue
      }
    })
  }
}

class DeleteCollectionStringEventListener
  implements
    EventListener<'collection:delete-string', DeleteCollectionStringEventData>
{
  private previousValue: string | undefined
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: DeleteCollectionStringEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      this.previousValue = collectionData.strings[event.data.key]
      delete collectionData.strings[event.data.key]
    })
  }
  async undo(event: DeleteCollectionStringEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousValue !== undefined) {
        collectionData.strings[event.data.key] = this.previousValue
      }
    })
  }
}

class AddCollectionContractInterfaceEventListener
  implements
    EventListener<
      'collection:add-contract-interface',
      AddCollectionContractInterfaceEventData
    >
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionContractInterfaceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (
        collectionData.contractInterfaces.find(
          (contractInterface) =>
            contractInterface.hash === event.data.contractInterface.hash,
        )
      ) {
        return
      }

      const validationResult = validateContractInterface(
        event.data.contractInterface,
      )
      if (!validationResult.status) {
        throw new Error(validationResult.errors.join('\n'))
      }
      collectionData.contractInterfaces.push(event.data.contractInterface)
    })
  }
  async undo(event: AddCollectionContractInterfaceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.contractInterfaces.findIndex(
        (contractInterface) =>
          contractInterface.hash === event.data.contractInterface.hash,
      )
      if (index >= 0) {
        collectionData.contractInterfaces.splice(index, 1)
      }
    })
  }
}

class AddCollectionLinkEventListener
  implements EventListener<'collection:add-link', AddCollectionLinkEventData>
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionLinkEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.links.findIndex(
        (link) => link.url === event.data.link.url,
      )
      if (index >= 0) {
        collectionData.links[index] = event.data.link
      } else {
        collectionData.links.push(event.data.link)
      }
    })
  }
  async undo(event: AddCollectionLinkEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.links.findIndex(
        (link) => link.url === event.data.link.url,
      )
      if (index >= 0) {
        collectionData.links.splice(index, 1)
      }
    })
  }
}

class RemoveCollectionContractInterfaceEventListener
  implements
    EventListener<
      'collection:remove-contract-interface',
      RemoveCollectionContractInterfaceEventData
    >
{
  private previousContractInterface: ContractInterface | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionContractInterfaceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.contractInterfaces.findIndex(
        (contractInterface) =>
          contractInterface.hash === event.data.contractInterfaceHash,
      )
      if (index >= 0) {
        this.previousContractInterface =
          collectionData.contractInterfaces[index]
        collectionData.contractInterfaces.splice(index, 1)
      }
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousContractInterface !== undefined) {
        collectionData.contractInterfaces.push(this.previousContractInterface)
      }
    })
  }
}

class RemoveCollectionLinkEventListener
  implements
    EventListener<'collection:remove-link', RemoveCollectionLinkEventData>
{
  private previousLink: Link | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionLinkEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.links.findIndex(
        (link) => link.url === event.data.url,
      )
      if (index >= 0) {
        this.previousLink = collectionData.links[index]
        collectionData.links.splice(index, 1)
      }
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousLink !== undefined) {
        collectionData.links.push(this.previousLink)
      }
    })
  }
}

class RenameCollectionEventListener
  implements EventListener<'collection:rename', RenameCollectionEventData>
{
  private oldName: string | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RenameCollectionEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      this.oldName = collectionData.name
      collectionData.name = event.data.name
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.oldName !== undefined) {
        collectionData.name = this.oldName
      }
    })
  }
}

class UpdateCollectionDescriptionEventListener
  implements
    EventListener<
      'collection:update-description',
      UpdateCollectionDescriptionEventData
    >
{
  private oldDescription: string | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: UpdateCollectionDescriptionEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      this.oldDescription = collectionData.description
      collectionData.description = event.data.description
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.oldDescription !== undefined) {
        collectionData.description = this.oldDescription
      }
    })
  }
}
class RenameCollectionContractInterfaceEventListener
  implements
    EventListener<
      'collection:rename-contract-interface',
      RenameCollectionContractInterfaceEventData
    >
{
  private previousName: string | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RenameCollectionContractInterfaceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const contractInterface = collectionData.contractInterfaces.find(
        (contractInterface) =>
          contractInterface.hash === event.data.contractInterfaceHash,
      )
      if (contractInterface) {
        this.previousName = contractInterface.name
        contractInterface.name = event.data.name
      }
    })
  }
  async undo(event: RenameCollectionContractInterfaceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousName !== undefined) {
        const contractInterface = collectionData.contractInterfaces.find(
          (contractInterface) =>
            contractInterface.hash === event.data.contractInterfaceHash,
        )
        if (contractInterface) {
          contractInterface.name = this.previousName
        }
      }
    })
  }
}

class AddCollectionContractEventListener
  implements
    EventListener<'collection:add-contract', AddCollectionContractEventData>
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionContractEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (
        collectionData.contracts.find(
          (contract) => contract.id === event.data.contract.id,
        )
      ) {
        return
      }

      collectionData.contracts.push(event.data.contract)
    })
  }
  async undo(event: AddCollectionContractEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.contracts.findIndex(
        (contract) => contract.id === event.data.contract.id,
      )
      if (index >= 0) {
        collectionData.contracts.splice(index, 1)
      }
    })
  }
}

class RemoveCollectionContractEventListener
  implements
    EventListener<
      'collection:remove-contract',
      RemoveCollectionContractEventData
    >
{
  private previousContract: ContractDefinition | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionContractEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.contracts.findIndex(
        (contract) => contract.id === event.data.contractId,
      )
      if (index >= 0) {
        this.previousContract = collectionData.contracts[index]
        collectionData.contracts.splice(index, 1)
      }
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousContract !== undefined) {
        collectionData.contracts.push(this.previousContract)
      }
    })
  }
}

class AddCollectionContractInstanceEventListener
  implements
    EventListener<
      'collection:add-contract-instance',
      AddCollectionContractInstanceEventData
    >
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionContractInstanceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const contract = collectionData.contracts.find(
        (contract) => contract.id === event.data.contractId,
      )

      if (!contract) {
        return
      }

      if (
        contract.instances.find(
          (instance) =>
            instance.address === event.data.address &&
            instance.chainId === event.data.chainId,
        )
      ) {
        return
      }

      contract.instances.push({
        chainId: event.data.chainId,
        address: event.data.address,
      })
    })
  }
  async undo(event: AddCollectionContractInstanceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const contract = collectionData.contracts.find(
        (contract) => contract.id === event.data.contractId,
      )

      if (!contract) {
        return
      }

      const index = contract.instances.findIndex(
        (instance) =>
          instance.address === event.data.address &&
          instance.chainId === event.data.chainId,
      )
      if (index >= 0) {
        contract.instances.splice(index, 1)
      }
    })
  }
}

class RemoveCollectionContractInstanceEventListener
  implements
    EventListener<
      'collection:remove-contract-instance',
      RemoveCollectionContractInstanceEventData
    >
{
  private previousInstance: { chainId: number; address: string } | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionContractInstanceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const contract = collectionData.contracts.find(
        (contract) => contract.id === event.data.contractId,
      )

      if (!contract) {
        return
      }

      const index = contract.instances.findIndex(
        (instance) =>
          instance.address === event.data.address &&
          instance.chainId === event.data.chainId,
      )
      if (index >= 0) {
        this.previousInstance = contract.instances[index]
        contract.instances.splice(index, 1)
      }

      // remove the contract if it has no instances
      if (contract.instances.length === 0) {
        collectionData.contracts.splice(
          collectionData.contracts.findIndex(
            (contract) => contract.id === event.data.contractId,
          ),
          1,
        )
      }
    })
  }
  async undo(event: RemoveCollectionContractInstanceEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const contract = collectionData.contracts.find(
        (contract) => contract.id === event.data.contractId,
      )

      if (!contract || !this.previousInstance) {
        return
      }

      contract.instances.push(this.previousInstance)
    })
  }
}

class RenameCollectionContractEventListener
  implements
    EventListener<
      'collection:rename-contract',
      RenameCollectionContractEventData
    >
{
  private previousName: string | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RenameCollectionContractEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const contract = collectionData.contracts.find(
        (contract) => contract.id === event.data.contractId,
      )
      if (contract) {
        this.previousName = contract.name
        contract.name = event.data.name
      }
    })
  }
  async undo(event: RenameCollectionContractEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousName !== undefined) {
        const contract = collectionData.contracts.find(
          (contract) => contract.id === event.data.contractId,
        )
        if (contract) {
          contract.name = this.previousName
        }
      }
    })
  }
}

class AddCollectionVariableEventListener
  implements
    EventListener<'collection:add-variable', AddCollectionVariableEventData>
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const variable = collectionData.variables.find(
        (variable) => variable.name === event.data.variable.name,
      )
      if (variable) {
        variable.value = event.data.variable.value
      } else {
        collectionData.variables.push(event.data.variable)
      }
    })
  }
  async undo(event: AddCollectionVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.variables.findIndex(
        (variable) => variable.name === event.data.variable.name,
      )
      if (index >= 0) {
        collectionData.variables.splice(index, 1)
      }
    })
  }
}

class RenameCollectionVariableEventListener
  implements
    EventListener<
      'collection:rename-variable',
      RenameCollectionVariableEventData
    >
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RenameCollectionVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const variable = collectionData.variables.find(
        (variable) => variable.name === event.data.oldName,
      )
      if (variable) {
        variable.name = event.data.newName
      }
    })
  }
  async undo(event: RenameCollectionVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const variable = collectionData.variables.find(
        (variable) => variable.name === event.data.newName,
      )
      if (variable) {
        variable.name = event.data.oldName
      }
    })
  }
}

class RemoveCollectionVariableEventListener
  implements
    EventListener<
      'collection:remove-variable',
      RemoveCollectionVariableEventData
    >
{
  private previousVariable: VariableDefinition | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.variables.findIndex(
        (variable) => variable.name === event.data.name,
      )
      if (index >= 0) {
        this.previousVariable = collectionData.variables[index]
        collectionData.variables.splice(index, 1)
      }
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousVariable !== undefined) {
        collectionData.variables.push(this.previousVariable)
      }
    })
  }
}

class AddCollectionWorkflowEventListener
  implements
    EventListener<'collection:add-workflow', AddCollectionWorkflowEventData>
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionWorkflowEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (
        collectionData.workflows.find(
          (workflow) => workflow.id === event.data.workflow.id,
        )
      ) {
        return
      }

      collectionData.workflows.push(event.data.workflow)
    })
  }
  async undo(event: AddCollectionWorkflowEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.workflows.findIndex(
        (workflow) => workflow.id === event.data.workflow.id,
      )
      if (index >= 0) {
        collectionData.workflows.splice(index, 1)
      }
    })
  }
}

class RenameCollectionWorkflowEventListener
  implements
    EventListener<
      'collection:rename-workflow',
      RenameCollectionWorkflowEventData
    >
{
  private previousName: string | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RenameCollectionWorkflowEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (workflow) {
        this.previousName = workflow.name
        workflow.name = event.data.name
      }
    })
  }
  async undo(event: RenameCollectionWorkflowEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (workflow && this.previousName) {
        workflow.name = this.previousName
      }
    })
  }
}

class RemoveCollectionWorkflowEventListener
  implements
    EventListener<
      'collection:remove-workflow',
      RemoveCollectionWorkflowEventData
    >
{
  private previousWorkflow: WorkflowDefinition | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionWorkflowEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const index = collectionData.workflows.findIndex(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (index >= 0) {
        this.previousWorkflow = collectionData.workflows[index]
        collectionData.workflows.splice(index, 1)
      }
    })
  }
  async undo() {
    this.dataHandle.change((collectionData: CollectionData) => {
      if (this.previousWorkflow !== undefined) {
        collectionData.workflows.push(this.previousWorkflow)
      }
    })
  }
}

class AddCollectionWorkflowVariableEventListener
  implements
    EventListener<
      'collection:add-workflow-variable',
      AddCollectionWorkflowVariableEventData
    >
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: AddCollectionWorkflowVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )

      if (!workflow) {
        return
      }

      const variable = workflow.variables.find(
        (variable) => variable.name === event.data.variable.name,
      )
      if (variable) {
        variable.value = event.data.variable.value
      } else {
        workflow.variables.push(event.data.variable)
      }
    })
  }
  async undo(event: AddCollectionWorkflowVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      const index = workflow.variables.findIndex(
        (variable) => variable.name === event.data.variable.name,
      )
      if (index >= 0) {
        workflow.variables.splice(index, 1)
      }
    })
  }
}

class RenameCollectionWorkflowVariableEventListener
  implements
    EventListener<
      'collection:rename-workflow-variable',
      RenameCollectionWorkflowVariableEventData
    >
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RenameCollectionWorkflowVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (workflow) {
        const variable = workflow.variables.find(
          (variable) => variable.name === event.data.oldName,
        )
        if (variable) {
          variable.name = event.data.newName
        }
      }
    })
  }
  async undo(event: RenameCollectionWorkflowVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      const variable = workflow.variables.find(
        (variable) => variable.name === event.data.newName,
      )
      if (variable) {
        variable.name = event.data.oldName
      }
    })
  }
}

class RemoveCollectionWorkflowVariableEventListener
  implements
    EventListener<
      'collection:remove-workflow-variable',
      RemoveCollectionWorkflowVariableEventData
    >
{
  private previousVariable: VariableDefinition | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionWorkflowVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      const index = workflow.variables.findIndex(
        (variable) => variable.name === event.data.name,
      )
      if (index >= 0) {
        this.previousVariable = workflow.variables[index]
        workflow.variables.splice(index, 1)
      }
    })
  }
  async undo(event: RemoveCollectionWorkflowVariableEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow || !this.previousVariable) {
        return
      }

      workflow.variables.push(this.previousVariable)
    })
  }
}

class AddCollectionWorkflowFunctionEventListener
  implements
    EventListener<
      'collection:add-workflow-function',
      AddCollectionWorkflowFunctionEventData
    >
{
  private interfaces: Map<string, Interface>
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {
    this.interfaces = new Map()
  }

  async process(event: AddCollectionWorkflowFunctionEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      if (!workflow.execution) {
        workflow.execution = []
      }

      if (
        workflow.execution.length > 0 &&
        typeof workflow.execution[0] !== 'string'
      ) {
        return
      }

      const execution = workflow.execution as string[]
      this.validateWorkflowFunctions(collectionData, [
        ...execution,
        event.data.functionKey,
      ])
      execution.push(event.data.functionKey)
    })
  }
  async undo(event: AddCollectionWorkflowFunctionEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      const index = workflow.execution.findIndex(
        (functionKey) => functionKey === event.data.functionKey,
      )
      if (index >= 0) {
        workflow.execution.splice(index, 1)
      }
    })
  }

  private validateWorkflowFunctions(
    collectionData: Readonly<CollectionData>,
    functions: string[],
  ) {
    let activeNetworks: Set<number> | undefined

    for (const f of functions) {
      const contractId = f.split('.')[0]
      const contract = collectionData.contracts.find(
        (contract) => contract.id === contractId,
      )
      if (!contract) {
        throw new Error(`Contract '${contractId}' not found`)
      }

      const iface = this.getInterface(collectionData, contract.interfaceHash)
      if (!iface) {
        throw new Error(
          `Contract interface '${contract.interfaceHash}' not found`,
        )
      }

      const chainIds = contract.instances.map((instance) => instance.chainId)
      if (!activeNetworks) {
        activeNetworks = new Set(chainIds)
      } else {
        activeNetworks = intersect(activeNetworks, chainIds)
      }
      if (activeNetworks.size === 0) {
        throw new Error('Workflow functions must be on the same networks')
      }
    }
  }

  private getInterface(collectionData: Readonly<CollectionData>, hash: string) {
    if (this.interfaces.has(hash)) {
      return this.interfaces.get(hash)!
    }

    const contractInterface = collectionData.contractInterfaces.find(
      (iface) => iface.hash === hash,
    )

    if (!contractInterface) {
      throw new Error(`Contract interface '${hash}' not found`)
    }

    this.interfaces.set(hash, new Interface(contractInterface.abi))
    return this.interfaces.get(hash)!
  }
}

class RemoveCollectionWorkflowFunctionEventListener
  implements
    EventListener<
      'collection:remove-workflow-function',
      RemoveCollectionWorkflowFunctionEventData
    >
{
  private previousFunctionKey: string | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: RemoveCollectionWorkflowFunctionEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      const index = workflow.execution.findIndex(
        (functionKey) => functionKey === event.data.functionKey,
      )
      if (index >= 0) {
        this.previousFunctionKey = workflow.execution[index] as string
        workflow.execution.splice(index, 1)
      }
    })
  }
  async undo(event: RemoveCollectionWorkflowFunctionEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow || !this.previousFunctionKey) {
        return
      }

      const execution = workflow.execution as string[]
      execution.push(this.previousFunctionKey)
    })
  }
}

class SetWorkflowCodeEventListener
  implements
    EventListener<
      'collection:set-workflow-code',
      SetCollectionWorkflowCodeEventData
    >
{
  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: SetCollectionWorkflowCodeEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      if (!workflow.execution) {
        workflow.execution = []
      }

      if (workflow.execution.some((e) => typeof e === 'string')) {
        throw new Error(
          'Cannot set code for non-snippet workflow. Remove all functions first.',
        )
      }

      const execution = workflow.execution as CodeSnippet[]
      const applicableExecution = execution.find(
        (e) => e.language === event.data.language,
      )

      if (applicableExecution) {
        applicableExecution.code = event.data.code
      } else {
        execution.push({
          code: event.data.code,
          language: event.data.language,
        })
      }
    })
  }
  async undo(event: SetCollectionWorkflowCodeEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow?.execution) {
        return
      }

      const execution = workflow.execution as CodeSnippet[]
      const index = execution.findIndex(
        (snippet) => snippet.language === event.data.language,
      )
      if (index >= 0) {
        execution.splice(index, 1)
      }
    })
  }
}

class DeleteWorkflowCodeEventListener
  implements
    EventListener<
      'collection:delete-workflow-code',
      DeleteCollectionWorkflowCodeEventData
    >
{
  private previousSnippet: CodeSnippet | undefined

  constructor(private readonly dataHandle: DocHandle<CollectionData>) {}

  async process(event: DeleteCollectionWorkflowCodeEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow) {
        return
      }

      const isSnippetWorkflow =
        !workflow.execution.length || typeof workflow.execution[0] === 'object'

      if (!isSnippetWorkflow) {
        throw new Error(
          'Cannot delete code for non-snippet workflow. Remove all functions first.',
        )
      }

      const execution = workflow.execution as CodeSnippet[]
      const index = execution.findIndex(
        (snippet) => snippet.language === event.data.language,
      )
      if (index >= 0) {
        this.previousSnippet = execution[index]
        execution.splice(index, 1)
      }
    })
  }
  async undo(event: DeleteCollectionWorkflowCodeEvent) {
    this.dataHandle.change((collectionData: CollectionData) => {
      const workflow = collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflowId,
      )
      if (!workflow || !this.previousSnippet) {
        return
      }

      const execution = workflow.execution as CodeSnippet[]
      execution.push(this.previousSnippet)
    })
  }
}
