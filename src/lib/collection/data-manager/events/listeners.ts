import { EventEmitter, EventListener } from '../../events'
import {
  CollectionData,
  ContractDefinition,
  ContractInterface,
  Link,
  VariableDefinition,
} from '../../spec'

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
  UpdateCollectionDescriptionEvent,
  UpdateCollectionDescriptionEventData,
  UpdateCollectionStringEvent,
} from './types'

export function registerDataUpdateListeners(
  eventEmitter: EventEmitter,
  data: CollectionData,
) {
  eventEmitter.on('collection:rename', new RenameCollectionEventListener(data))
  eventEmitter.on(
    'collection:update-description',
    new UpdateCollectionDescriptionEventListener(data),
  )
  eventEmitter.on(
    'collection:update-string',
    new UpdateCollectionStringEventListener(data),
  )
  eventEmitter.on(
    'collection:delete-string',
    new DeleteCollectionStringEventListener(data),
  )
  eventEmitter.on(
    'collection:add-link',
    new AddCollectionLinkEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-link',
    new RemoveCollectionLinkEventListener(data),
  )
  eventEmitter.on(
    'collection:add-contract-interface',
    new AddCollectionContractInterfaceEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-contract-interface',
    new RemoveCollectionContractInterfaceEventListener(data),
  )
  eventEmitter.on(
    'collection:rename-contract-interface',
    new RenameCollectionContractInterfaceEventListener(data),
  )
  eventEmitter.on(
    'collection:add-contract',
    new AddCollectionContractEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-contract',
    new RemoveCollectionContractEventListener(data),
  )
  eventEmitter.on(
    'collection:rename-contract',
    new RenameCollectionContractEventListener(data),
  )
  eventEmitter.on(
    'collection:add-contract-instance',
    new AddCollectionContractInstanceEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-contract-instance',
    new RemoveCollectionContractInstanceEventListener(data),
  )
  eventEmitter.on(
    'collection:add-variable',
    new AddCollectionVariableEventListener(data),
  )
  eventEmitter.on(
    'collection:rename-variable',
    new RenameCollectionVariableEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-variable',
    new RemoveCollectionVariableEventListener(data),
  )
  eventEmitter.on(
    'collection:add-workflow',
    new AddCollectionWorkflowEventListener(data),
  )
  eventEmitter.on(
    'collection:rename-workflow',
    new RenameCollectionWorkflowEventListener(data),
  )
  eventEmitter.on(
    'collection:add-workflow-variable',
    new AddCollectionWorkflowVariableEventListener(data),
  )
  eventEmitter.on(
    'collection:rename-workflow-variable',
    new RenameCollectionWorkflowVariableEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-workflow-variable',
    new RemoveCollectionWorkflowVariableEventListener(data),
  )
  eventEmitter.on(
    'collection:add-workflow-function',
    new AddCollectionWorkflowFunctionEventListener(data),
  )
  eventEmitter.on(
    'collection:remove-workflow-function',
    new RemoveCollectionWorkflowFunctionEventListener(data),
  )
}

class UpdateCollectionStringEventListener
  implements EventListener<'collection:update-string'>
{
  private previousValue: string | undefined
  constructor(private readonly collectionData: CollectionData) {}

  process(event: UpdateCollectionStringEvent) {
    this.previousValue = this.collectionData.strings[event.data.key]
    this.collectionData.strings[event.data.key] = event.data.value
  }

  undo(event: UpdateCollectionStringEvent) {
    if (this.previousValue === undefined) {
      delete this.collectionData.strings[event.data.key]
    } else {
      this.collectionData.strings[event.data.key] = this.previousValue
    }
  }
}

class DeleteCollectionStringEventListener
  implements EventListener<'collection:delete-string'>
{
  private previousValue: string | undefined
  constructor(private readonly collectionData: CollectionData) {}

  process(event: DeleteCollectionStringEvent) {
    this.previousValue = this.collectionData.strings[event.data.key]
    delete this.collectionData.strings[event.data.key]
  }

  undo(event: DeleteCollectionStringEvent) {
    if (this.previousValue !== undefined) {
      this.collectionData.strings[event.data.key] = this.previousValue
    }
  }
}

class AddCollectionContractInterfaceEventListener
  implements
    EventListener<
      'collection:add-contract-interface',
      AddCollectionContractInterfaceEventData
    >
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionContractInterfaceEvent) {
    if (
      this.collectionData.contractInterfaces.find(
        (contractInterface) =>
          contractInterface.hash === event.data.contractInterface.hash,
      )
    ) {
      return
    }
    this.collectionData.contractInterfaces.push(event.data.contractInterface)
  }

  undo(event: AddCollectionContractInterfaceEvent) {
    const index = this.collectionData.contractInterfaces.findIndex(
      (contractInterface) =>
        contractInterface.hash === event.data.contractInterface.hash,
    )
    if (index >= 0) {
      this.collectionData.contractInterfaces.splice(index, 1)
    }
  }
}

class AddCollectionLinkEventListener
  implements EventListener<'collection:add-link', AddCollectionLinkEventData>
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionLinkEvent) {
    const index = this.collectionData.links.findIndex(
      (link) => link.url === event.data.link.url,
    )
    if (index >= 0) {
      this.collectionData.links[index] = event.data.link
    } else {
      this.collectionData.links.push(event.data.link)
    }
  }

  undo(event: AddCollectionLinkEvent) {
    const index = this.collectionData.links.findIndex(
      (link) => link.url === event.data.link.url,
    )
    if (index >= 0) {
      this.collectionData.links.splice(index, 1)
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionContractInterfaceEvent) {
    const index = this.collectionData.contractInterfaces.findIndex(
      (contractInterface) =>
        contractInterface.hash === event.data.contractInterfaceHash,
    )
    if (index >= 0) {
      this.previousContractInterface =
        this.collectionData.contractInterfaces[index]
      this.collectionData.contractInterfaces.splice(index, 1)
    }
  }

  undo() {
    if (this.previousContractInterface !== undefined) {
      this.collectionData.contractInterfaces.push(
        this.previousContractInterface,
      )
    }
  }
}

class RemoveCollectionLinkEventListener
  implements
    EventListener<'collection:remove-link', RemoveCollectionLinkEventData>
{
  private previousLink: Link | undefined

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionLinkEvent) {
    const index = this.collectionData.links.findIndex(
      (link) => link.url === event.data.url,
    )
    if (index >= 0) {
      this.previousLink = this.collectionData.links[index]
      this.collectionData.links.splice(index, 1)
    }
  }

  undo() {
    if (this.previousLink !== undefined) {
      this.collectionData.links.push(this.previousLink)
    }
  }
}

class RenameCollectionEventListener
  implements EventListener<'collection:rename', RenameCollectionEventData>
{
  private oldName: string | undefined

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RenameCollectionEvent) {
    this.oldName = this.collectionData.name
    this.collectionData.name = event.data.name
  }

  undo() {
    if (this.oldName !== undefined) {
      this.collectionData.name = this.oldName
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: UpdateCollectionDescriptionEvent) {
    this.oldDescription = this.collectionData.description
    this.collectionData.description = event.data.description
  }

  undo() {
    if (this.oldDescription !== undefined) {
      this.collectionData.description = this.oldDescription
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RenameCollectionContractInterfaceEvent) {
    const contractInterface = this.collectionData.contractInterfaces.find(
      (contractInterface) =>
        contractInterface.hash === event.data.contractInterfaceHash,
    )
    if (contractInterface) {
      this.previousName = contractInterface.name
      contractInterface.name = event.data.name
    }
  }

  undo(event: RenameCollectionContractInterfaceEvent) {
    if (this.previousName !== undefined) {
      const contractInterface = this.collectionData.contractInterfaces.find(
        (contractInterface) =>
          contractInterface.hash === event.data.contractInterfaceHash,
      )
      if (contractInterface) {
        contractInterface.name = this.previousName
      }
    }
  }
}

class AddCollectionContractEventListener
  implements
    EventListener<'collection:add-contract', AddCollectionContractEventData>
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionContractEvent) {
    if (
      this.collectionData.contracts.find(
        (contract) => contract.id === event.data.contract.id,
      )
    ) {
      return
    }

    this.collectionData.contracts.push(event.data.contract)
  }

  undo(event: AddCollectionContractEvent) {
    const index = this.collectionData.contracts.findIndex(
      (contract) => contract.id === event.data.contract.id,
    )
    if (index >= 0) {
      this.collectionData.contracts.splice(index, 1)
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionContractEvent) {
    const index = this.collectionData.contracts.findIndex(
      (contract) => contract.id === event.data.contractId,
    )
    if (index >= 0) {
      this.previousContract = this.collectionData.contracts[index]
      this.collectionData.contracts.splice(index, 1)
    }
  }

  undo() {
    if (this.previousContract !== undefined) {
      this.collectionData.contracts.push(this.previousContract)
    }
  }
}

class AddCollectionContractInstanceEventListener
  implements
    EventListener<
      'collection:add-contract-instance',
      AddCollectionContractInstanceEventData
    >
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionContractInstanceEvent) {
    const contract = this.collectionData.contracts.find(
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
  }

  undo(event: AddCollectionContractInstanceEvent) {
    const contract = this.collectionData.contracts.find(
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionContractInstanceEvent) {
    const contract = this.collectionData.contracts.find(
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
  }

  undo(event: RemoveCollectionContractInstanceEvent) {
    const contract = this.collectionData.contracts.find(
      (contract) => contract.id === event.data.contractId,
    )

    if (!contract || !this.previousInstance) {
      return
    }

    contract.instances.push(this.previousInstance)
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RenameCollectionContractEvent) {
    const contract = this.collectionData.contracts.find(
      (contract) => contract.id === event.data.contractId,
    )
    if (contract) {
      this.previousName = contract.name
      contract.name = event.data.name
    }
  }

  undo(event: RenameCollectionContractEvent) {
    if (this.previousName !== undefined) {
      const contract = this.collectionData.contracts.find(
        (contract) => contract.id === event.data.contractId,
      )
      if (contract) {
        contract.name = this.previousName
      }
    }
  }
}

class AddCollectionVariableEventListener
  implements
    EventListener<'collection:add-variable', AddCollectionVariableEventData>
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionVariableEvent) {
    const variable = this.collectionData.variables.find(
      (variable) => variable.name === event.data.variable.name,
    )
    if (variable) {
      variable.value = event.data.variable.value
    } else {
      this.collectionData.variables.push(event.data.variable)
    }
  }

  undo(event: AddCollectionVariableEvent) {
    const index = this.collectionData.variables.findIndex(
      (variable) => variable.name === event.data.variable.name,
    )
    if (index >= 0) {
      this.collectionData.variables.splice(index, 1)
    }
  }
}

class RenameCollectionVariableEventListener
  implements
    EventListener<
      'collection:rename-variable',
      RenameCollectionVariableEventData
    >
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: RenameCollectionVariableEvent) {
    const variable = this.collectionData.variables.find(
      (variable) => variable.name === event.data.oldName,
    )
    if (variable) {
      variable.name = event.data.newName
    }
  }

  undo(event: RenameCollectionVariableEvent) {
    const variable = this.collectionData.variables.find(
      (variable) => variable.name === event.data.newName,
    )
    if (variable) {
      variable.name = event.data.oldName
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionVariableEvent) {
    const index = this.collectionData.variables.findIndex(
      (variable) => variable.name === event.data.name,
    )
    if (index >= 0) {
      this.previousVariable = this.collectionData.variables[index]
      this.collectionData.variables.splice(index, 1)
    }
  }

  undo() {
    if (this.previousVariable !== undefined) {
      this.collectionData.variables.push(this.previousVariable)
    }
  }
}

class AddCollectionWorkflowEventListener
  implements
    EventListener<'collection:add-workflow', AddCollectionWorkflowEventData>
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionWorkflowEvent) {
    if (
      this.collectionData.workflows.find(
        (workflow) => workflow.id === event.data.workflow.id,
      )
    ) {
      return
    }

    this.collectionData.workflows.push(event.data.workflow)
  }

  undo(event: AddCollectionWorkflowEvent) {
    const index = this.collectionData.workflows.findIndex(
      (workflow) => workflow.id === event.data.workflow.id,
    )
    if (index >= 0) {
      this.collectionData.workflows.splice(index, 1)
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RenameCollectionWorkflowEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (workflow) {
      this.previousName = workflow.name
      workflow.name = event.data.name
    }
  }

  undo(event: RenameCollectionWorkflowEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (workflow && this.previousName) {
      workflow.name = this.previousName
    }
  }
}

class AddCollectionWorkflowVariableEventListener
  implements
    EventListener<
      'collection:add-workflow-variable',
      AddCollectionWorkflowVariableEventData
    >
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionWorkflowVariableEvent) {
    const workflow = this.collectionData.workflows.find(
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
  }

  undo(event: AddCollectionWorkflowVariableEvent) {
    const workflow = this.collectionData.workflows.find(
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
  }
}

class RenameCollectionWorkflowVariableEventListener
  implements
    EventListener<
      'collection:rename-workflow-variable',
      RenameCollectionWorkflowVariableEventData
    >
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: RenameCollectionWorkflowVariableEvent) {
    const workflow = this.collectionData.workflows.find(
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
  }

  undo(event: RenameCollectionWorkflowVariableEvent) {
    const workflow = this.collectionData.workflows.find(
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionWorkflowVariableEvent) {
    const workflow = this.collectionData.workflows.find(
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
  }

  undo(event: RemoveCollectionWorkflowVariableEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (!workflow || !this.previousVariable) {
      return
    }

    workflow.variables.push(this.previousVariable)
  }
}

class AddCollectionWorkflowFunctionEventListener
  implements
    EventListener<
      'collection:add-workflow-function',
      AddCollectionWorkflowFunctionEventData
    >
{
  constructor(private readonly collectionData: CollectionData) {}

  process(event: AddCollectionWorkflowFunctionEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (workflow) {
      workflow.functions.push(event.data.functionKey)
    }
  }

  undo(event: AddCollectionWorkflowFunctionEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (!workflow) {
      return
    }

    const index = workflow.functions.findIndex(
      (functionKey) => functionKey === event.data.functionKey,
    )
    if (index >= 0) {
      workflow.functions.splice(index, 1)
    }
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

  constructor(private readonly collectionData: CollectionData) {}

  process(event: RemoveCollectionWorkflowFunctionEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (!workflow) {
      return
    }

    const index = workflow.functions.findIndex(
      (functionKey) => functionKey === event.data.functionKey,
    )
    if (index >= 0) {
      this.previousFunctionKey = workflow.functions[index]
      workflow.functions.splice(index, 1)
    }
  }

  undo(event: RemoveCollectionWorkflowFunctionEvent) {
    const workflow = this.collectionData.workflows.find(
      (workflow) => workflow.id === event.data.workflowId,
    )
    if (!workflow || !this.previousFunctionKey) {
      return
    }

    workflow.functions.push(this.previousFunctionKey)
  }
}
