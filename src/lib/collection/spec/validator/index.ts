import { id, Interface, isAddress } from 'ethers'

import { supportedChains } from '../../../chains'
import {
  CollectionData,
  ContractDefinition,
  ContractInterface,
  Link,
  VariableDefinition,
  WorkflowDefinition,
} from '../types'

type ValidationParam<T> = Partial<T> | undefined
const identifierRegex = /^[a-zA-Z_]\w*$/

export class ValidationResult {
  warnings: string[] = []
  errors: string[] = []

  get status(): boolean {
    return !this.errors.length
  }

  toString(): string {
    return `Errors:\n  ${this.errors.join(
      '\n  ',
    )}\nWarnings:\n  ${this.warnings.join('\n  ')}\n`
  }
}

function createValidationResult(): ValidationResult {
  return new ValidationResult()
}

export function validateLink(
  link: ValidationParam<Link>,
  result?: ValidationResult,
): ValidationResult {
  result = result || createValidationResult()
  if (!link?.url) {
    result.errors.push('Invalid link')
  } else {
    try {
      new URL(link.url)
    } catch {
      result.errors.push('Invalid link')
    }
  }

  return result
}

export function validateIdentifier(
  identifier: string | undefined,
  result?: ValidationResult,
): ValidationResult {
  result = result || createValidationResult()
  if (!identifier || !identifierRegex.test(identifier || '')) {
    result.errors.push(`Invalid identifier: ${identifier}`)
  }
  return result
}

export function validateContractInterface(
  contractInterface: ValidationParam<ContractInterface>,
  result?: ValidationResult,
): ValidationResult {
  result = result || createValidationResult()
  if (!contractInterface) {
    result.errors.push('contract interface is null')
    return result
  }

  if (!contractInterface.abi) {
    result.errors.push('ABI is required')
    return result
  }

  if (contractInterface.hash !== id(contractInterface.abi)) {
    result.errors.push('ABI hash mismatch')
  }

  try {
    Interface.from(contractInterface.abi)
  } catch {
    result.errors.push('Invalid ABI')
  }

  return result
}

export function validateContractDefinition(
  contract: ValidationParam<ContractDefinition>,
  contractInterfaces: ContractInterface[],
  result?: ValidationResult,
): ValidationResult {
  result = result || createValidationResult()
  if (!contract) {
    result.errors.push('contract is null')
    return result
  }

  if (!contract.instances?.length) {
    result.errors.push('contract has no defined instances')
    return result
  }

  for (const instance of contract.instances) {
    if (!supportedChains.has(instance.chainId)) {
      result.errors.push(`Unsupported chain: ${instance.chainId}`)
    }

    if (!isAddress(instance.address || '')) {
      result.errors.push(`Invalid contract address: ${instance.address}`)
    }
  }

  const contractInterface = contractInterfaces.find(
    (i) => i.hash === contract.interfaceHash,
  )
  if (!contract.interfaceHash || !contractInterface) {
    result.errors.push('Contract interface is required')
  }

  return result
}

export function validateVariable(
  variable: ValidationParam<VariableDefinition>,
  result?: ValidationResult,
): ValidationResult {
  result = result || createValidationResult()
  if (!variable) {
    result.errors.push('variable is null')
    return result
  }

  validateIdentifier(variable.name, result)
  if (!variable.value && typeof variable.value !== 'string') {
    result.errors.push(`Invalid variable value: ${variable.name}`)
  }

  return result
}

export function validateWorkflow(
  workflow: ValidationParam<WorkflowDefinition>,
  contracts: Map<string, Interface>,
  result?: ValidationResult,
): ValidationResult {
  result = result || createValidationResult()
  if (!workflow) {
    result.errors.push('workflow is null')
    return result
  }

  if (!workflow.id) {
    result.errors.push('Workflow id is required')
  }

  if (!workflow.name) {
    result.errors.push('Workflow name is required')
  }

  if (!workflow.functions?.length) {
    result.errors.push('Please add a step to the workflow')
  }

  for (const step of workflow.functions || []) {
    const [contractId, functionSelector] = step.split('.')
    if (!contracts.has(contractId)) {
      result.errors.push(
        `Invalid contract id '${contractId}' in workflow '${workflow.id}'`,
      )
      continue
    }

    const contractInterface = contracts.get(contractId)!
    const functionFragment = contractInterface.getFunction(functionSelector)
    if (!functionFragment) {
      result.errors.push(
        `Invalid function selector '${functionSelector}' for contract '${contractId}' in workflow '${workflow.id}'`,
      )
    }
  }

  for (const variable of workflow.variables || []) {
    validateVariable(variable, result)
  }
  return result
}

export function validateCollection(
  collection: ValidationParam<CollectionData>,
): ValidationResult {
  const result = createValidationResult()

  if (!collection) {
    result.errors.push('collection is null')
    return result
  }

  if (!collection.name) {
    result.errors.push('Collection name is required')
  }

  if (!collection.description) {
    result.errors.push('Collection description is required')
  }

  for (const link of collection.links || []) {
    validateLink(link, result)
  }

  for (const variable of collection.variables || []) {
    validateVariable(variable, result)
  }

  if (!collection.contractInterfaces?.length) {
    result.warnings.push('There are no contract interfaces in the collection')
    return result
  }

  for (const contractInterface of collection.contractInterfaces || []) {
    validateContractInterface(contractInterface, result)
  }

  if (!collection.contracts?.length) {
    result.warnings.push('There are no contracts in the collection')
    return result
  }

  for (const contract of collection.contracts || []) {
    validateContractDefinition(contract, collection.contractInterfaces, result)
  }

  const contracts = new Map(
    collection.contracts
      .map((contract) => {
        const contractInterface = collection.contractInterfaces!.find(
          (i) => i.hash === contract.interfaceHash,
        )
        if (!contractInterface) {
          return undefined
        }

        return [contract.name, new Interface(contractInterface.abi)]
      })
      .filter((x) => x) as [string, Interface][],
  )

  for (const workflow of collection.workflows || []) {
    validateWorkflow(workflow, contracts, result)
  }
  return result
}
