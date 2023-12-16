import {
  BigNumberish,
  ErrorFragment,
  EventFragment,
  FunctionFragment,
} from 'ethers'

import { VariableDefinition } from '../spec'

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
