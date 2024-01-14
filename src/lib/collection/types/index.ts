import {
  BigNumberish,
  ErrorFragment,
  EventFragment,
  FunctionFragment,
  TransactionReceiptParams,
} from 'ethers'

import { VariableDefinition } from '../spec'

export type ExecutionError = {
  address?: string
  message: string
  data?: string
}

export type ExecutionResultData = Partial<TransactionReceiptParams> & {
  error?: ExecutionError
}

interface FragmentDisplayDataEntry {
  baseType: string
  indent: number
  index: number
  name: string
  path: string
  length?: number
  arrayPath?: string
  arrayIndex?: number
  indexInArray?: number
}

export type FragmentDisplayData = FragmentDisplayDataEntry[]

type SimpleContractParamValue = string | boolean | BigNumberish
export type ContractParam = SimpleContractParamValue | Array<ContractParam>

export interface ContractElementFragment {
  contractId: string
  fragmentKey: string
  signature: string
  fragment: FunctionFragment | EventFragment | ErrorFragment
}

export interface Environment {
  variables: VariableDefinition[]
}

export interface WidgetConfiguration {
  collectionURI: string
  functions: string[]
}
