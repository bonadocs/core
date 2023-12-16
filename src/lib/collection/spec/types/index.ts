import { BigNumberish } from 'ethers'

export interface Link {
  url: string
  text?: string
  icon?: string
}

/**
 * This represents a contract interface.
 */
export interface ContractInterface {
  /**
   * SHA256 hash of the ABI
   */
  hash: string

  /**
   * The name of the interface (eg: ERC20). Defaults to the name of the contract.
   */
  name: string

  /**
   * The ABI of the contract.
   */
  abi: string
}

/**
 * This is a single deployment of a contract.
 * It is identified by the chain code and the address.
 */
export interface ContractInstance {
  chainId: number
  address: string
}

/**
 * A contract definition specifies a contract in a protocol.
 * A single contract can have multiple deployments across various networks.
 * The deployments are specified in the instances array.
 *
 * The interfaceHash is the hash of the ABI of the contract. It is used
 * to refer to the ABI in the collection. Multiple contracts can share the same
 * interface - in that case they will have the same interfaceHash.
 */
export interface ContractDefinition {
  id: string
  name: string
  interfaceHash: string
  instances: ContractInstance[]
}

export interface VariableDefinition {
  name: string
  value: string
}

export interface TransactionOverrides {
  from?: string
  gasLimit?: BigNumberish
  gasPrice?: BigNumberish
  value?: BigNumberish
}

export interface SimulationAccountOverrides {
  address: string
  balance: BigNumberish
  storage: Record<string, string>
}

export interface SimulationOverrides {
  // executionTimestampSeconds: number
  accounts: SimulationAccountOverrides[]
}

export interface ExecutableEVMCall {
  to: string
  data?: string
  overrides: TransactionOverrides
  simulationOverrides?: SimulationOverrides
}

export interface ExecutionContext {
  variableMapping?: Record<string, string>
  overrides?: TransactionOverrides
  simulationOverrides?: SimulationOverrides
}

export interface WorkflowDefinition {
  id: string
  name: string
  variables: VariableDefinition[]

  /**
   * Array of `contractId.functionSelector`
   */
  functions: string[]
}

export interface WorkflowExecutionContext {
  workflow: WorkflowDefinition

  /**
   * Map of the `contractId.functionSelector` to the execution context.
   */
  contexts: Map<string, ExecutionContext>
}

export interface CollectionData {
  id: string
  name: string
  description: string
  strings: Record<string, string>
  links: Link[]
  contractInterfaces: ContractInterface[]
  contracts: ContractDefinition[]
  variables: VariableDefinition[]
  workflows: WorkflowDefinition[]
}
