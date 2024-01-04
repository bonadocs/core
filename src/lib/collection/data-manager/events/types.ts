import { Event } from '../../events'
import {
  CodeSnippetLanguage,
  ContractDefinition,
  ContractInterface,
  Link,
  VariableDefinition,
  WorkflowDefinition,
} from '../../spec'

export type RenameCollectionEventData = { collectionId: string; name: string }
export type UpdateCollectionDescriptionEventData = {
  collectionId: string
  description: string
}
export type UpdateCollectionStringEventData = {
  collectionId: string
  key: string
  value: string
}
export type DeleteCollectionStringEventData = {
  collectionId: string
  key: string
}
export type AddCollectionLinkEventData = { collectionId: string; link: Link }
export type RemoveCollectionLinkEventData = {
  collectionId: string
  url: string
}
export type AddCollectionContractInterfaceEventData = {
  collectionId: string
  contractInterface: ContractInterface
}
export type RemoveCollectionContractInterfaceEventData = {
  collectionId: string
  contractInterfaceHash: string
}
export type RenameCollectionContractInterfaceEventData = {
  collectionId: string
  contractInterfaceHash: string
  name: string
}
export type AddCollectionContractEventData = {
  collectionId: string
  contract: ContractDefinition
}
export type RemoveCollectionContractEventData = {
  collectionId: string
  contractId: string
}
export type AddCollectionContractInstanceEventData = {
  collectionId: string
  contractId: string
  chainId: number
  address: string
}
export type RemoveCollectionContractInstanceEventData = {
  collectionId: string
  contractId: string
  chainId: number
  address: string
}
export type RenameCollectionContractEventData = {
  collectionId: string
  contractId: string
  name: string
}
export type AddCollectionVariableEventData = {
  collectionId: string
  variable: VariableDefinition
}
export type RenameCollectionVariableEventData = {
  collectionId: string
  oldName: string
  newName: string
}
export type RemoveCollectionVariableEventData = {
  collectionId: string
  name: string
}
export type AddCollectionWorkflowEventData = {
  collectionId: string
  workflow: WorkflowDefinition
}
export type RenameCollectionWorkflowEventData = {
  collectionId: string
  workflowId: string
  name: string
}
export type RemoveCollectionWorkflowEventData = {
  collectionId: string
  workflowId: string
}
export type AddCollectionWorkflowVariableEventData = {
  collectionId: string
  workflowId: string
  variable: VariableDefinition
}
export type RenameCollectionWorkflowVariableEventData = {
  collectionId: string
  workflowId: string
  oldName: string
  newName: string
}
export type RemoveCollectionWorkflowVariableEventData = {
  collectionId: string
  workflowId: string
  name: string
}
export type AddCollectionWorkflowFunctionEventData = {
  collectionId: string
  workflowId: string
  functionKey: string
}
export type RemoveCollectionWorkflowFunctionEventData = {
  collectionId: string
  workflowId: string
  functionKey: string
}
export type SetCollectionWorkflowCodeEventData = {
  collectionId: string
  workflowId: string
  language: CodeSnippetLanguage
  code: string
}
export type DeleteCollectionWorkflowCodeEventData = {
  collectionId: string
  workflowId: string
  language: CodeSnippetLanguage
}
export type AddArrayItemEventData = {
  viewId: string
  arrayDefinitionIndex: number
}
export type RemoveArrayItemEventData = {
  viewId: string
  arrayDefinitionIndex: number
  indexToRemove: number
}

export type RenameCollectionEvent = Event<
  'collection:rename',
  RenameCollectionEventData
>
export type UpdateCollectionDescriptionEvent = Event<
  'collection:update-description',
  UpdateCollectionDescriptionEventData
>
export type UpdateCollectionStringEvent = Event<
  'collection:update-string',
  UpdateCollectionStringEventData
>
export type DeleteCollectionStringEvent = Event<
  'collection:delete-string',
  DeleteCollectionStringEventData
>
export type AddCollectionLinkEvent = Event<
  'collection:add-link',
  AddCollectionLinkEventData
>
export type RemoveCollectionLinkEvent = Event<
  'collection:remove-link',
  RemoveCollectionLinkEventData
>
export type AddCollectionContractInterfaceEvent = Event<
  'collection:add-contract-interface',
  AddCollectionContractInterfaceEventData
>
export type RemoveCollectionContractInterfaceEvent = Event<
  'collection:remove-contract-interface',
  RemoveCollectionContractInterfaceEventData
>
export type RenameCollectionContractInterfaceEvent = Event<
  'collection:rename-contract-interface',
  RenameCollectionContractInterfaceEventData
>
export type AddCollectionContractEvent = Event<
  'collection:add-contract',
  AddCollectionContractEventData
>
export type RemoveCollectionContractEvent = Event<
  'collection:remove-contract',
  RemoveCollectionContractEventData
>
export type RenameCollectionContractEvent = Event<
  'collection:rename-contract',
  RenameCollectionContractEventData
>
export type AddCollectionContractInstanceEvent = Event<
  'collection:add-contract-instance',
  AddCollectionContractInstanceEventData
>
export type RemoveCollectionContractInstanceEvent = Event<
  'collection:remove-contract-instance',
  RemoveCollectionContractInstanceEventData
>
export type AddCollectionVariableEvent = Event<
  'collection:add-variable',
  AddCollectionVariableEventData
>
export type RenameCollectionVariableEvent = Event<
  'collection:rename-variable',
  RenameCollectionVariableEventData
>
export type RemoveCollectionVariableEvent = Event<
  'collection:remove-variable',
  RemoveCollectionVariableEventData
>
export type AddCollectionWorkflowEvent = Event<
  'collection:add-workflow',
  AddCollectionWorkflowEventData
>
export type RenameCollectionWorkflowEvent = Event<
  'collection:rename-workflow',
  RenameCollectionWorkflowEventData
>
export type RemoveCollectionWorkflowEvent = Event<
  'collection:remove-workflow',
  RemoveCollectionWorkflowEventData
>
export type AddCollectionWorkflowVariableEvent = Event<
  'collection:add-workflow-variable',
  AddCollectionWorkflowVariableEventData
>
export type RenameCollectionWorkflowVariableEvent = Event<
  'collection:rename-workflow-variable',
  RenameCollectionWorkflowVariableEventData
>
export type RemoveCollectionWorkflowVariableEvent = Event<
  'collection:remove-workflow-variable',
  RemoveCollectionWorkflowVariableEventData
>
export type AddCollectionWorkflowFunctionEvent = Event<
  'collection:add-workflow-function',
  AddCollectionWorkflowFunctionEventData
>
export type RemoveCollectionWorkflowFunctionEvent = Event<
  'collection:remove-workflow-function',
  RemoveCollectionWorkflowFunctionEventData
>
export type SetCollectionWorkflowCodeEvent = Event<
  'collection:set-workflow-code',
  SetCollectionWorkflowCodeEventData
>
export type DeleteCollectionWorkflowCodeEvent = Event<
  'collection:delete-workflow-code',
  DeleteCollectionWorkflowCodeEventData
>
export type AddArrayItemEvent = Event<'add-array-item', AddArrayItemEventData>
export type RemoveArrayItemEvent = Event<
  'remove-array-item',
  RemoveArrayItemEventData
>
