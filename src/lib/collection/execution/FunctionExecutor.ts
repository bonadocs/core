import {
  Interface,
  isCallException,
  Provider,
  Signer,
  ZeroAddress,
} from 'ethers'

import { CollectionDataManager, FunctionFragmentView } from '../data-manager'
import { TransactionSimulator } from '../simulation'
import type { ExecutableEVMCall, ExecutionContext } from '../spec'
import { ExecutionResultData } from '../types'
import { intersect } from '../util'

import { ExecutionResult } from './ExecutionResult'
import {
  convertResultToDisplayResult,
  DisplayResult,
  getExecutionType,
  getProvider,
} from './util'

interface ExecutableFunctionConfiguration {
  contractId: string
  contractInterface: Interface
  fragmentView: FunctionFragmentView
  context: ExecutionContext
}

export class FunctionExecutor {
  readonly functions: readonly ExecutableFunctionConfiguration[]
  private readonly _transactionSimulator: TransactionSimulator
  private readonly supportedChains: Set<number>
  private readonly contractAddresses: Map<number, Map<string, string>>
  private signer: Signer | null = null
  private provider: Provider | null = null
  private activeChainId: number

  private constructor(
    supportedChains: Set<number>,
    config: ExecutableFunctionConfiguration[],
  ) {
    if (!config.length) {
      throw new Error('No functions to execute')
    }

    this.functions = config
    this._transactionSimulator = new TransactionSimulator()
    this.supportedChains = supportedChains
    this.activeChainId = this.supportedChains.values().next().value
    this.contractAddresses = new Map()
  }

  static async createFunctionExecutor(
    dataManager: CollectionDataManager,
    functionKeys: string[],
  ): Promise<FunctionExecutor> {
    const executionType = getExecutionType(functionKeys)
    if (executionType !== 'functions') {
      throw new Error('Code snippets are not supported yet')
    }

    const configs = await getExecutableFunctionConfigurations(
      dataManager,
      functionKeys,
    )

    const executor = new FunctionExecutor(
      getActiveNetworks(dataManager, functionKeys),
      configs,
    )

    for (const config of configs) {
      const contract = dataManager.contractManagerView.getContract(
        config.contractId,
      )
      if (!contract) {
        throw new Error('Invalid contract ID')
      }

      for (const instance of contract.instances) {
        if (!executor.supportedChains.has(instance.chainId)) {
          continue
        }

        if (!executor.contractAddresses.has(instance.chainId)) {
          executor.contractAddresses.set(instance.chainId, new Map())
        }

        executor.contractAddresses
          .get(instance.chainId)!
          .set(contract.id, instance.address)
      }
    }
    return executor
  }

  /**
   * Sets the signer to use for signed transactions.
   * @param signer
   */
  setSigner(signer: Signer) {
    this.signer = signer
  }

  setActiveChainId(chainId: number) {
    if (!this.supportedChains.has(chainId)) {
      throw new Error('Unsupported chain')
    }

    this.activeChainId = chainId
  }

  getExecutionContext(index: number): ExecutionContext {
    return this.functions[index].context
  }

  get functionViews(): readonly FunctionFragmentView[] {
    return this.functions.map((func) => func.fragmentView)
  }

  async clearFunctionViews() {
    for (const func of this.functions) {
      await func.fragmentView.clear()
    }
  }

  /**
   * Runs a static call on the contract. This is only supported for
   * constant (read-only) functions.
   *
   * @param func
   */
  async readFunction(
    func: ExecutableFunctionConfiguration,
  ): Promise<DisplayResult> {
    if (!func.fragmentView.fragment.constant) {
      throw new Error('Static calls not supported for non-constant functions')
    }

    this.provider = await this.getProvider()
    const call = await this.prepareExecutableCall(func)

    const result = func.contractInterface.decodeFunctionResult(
      func.fragmentView.fragment,
      await this.provider.call({
        from: call.overrides.from,
        to: call.to,
        data: call.data,
        ...call.overrides,
      }),
    )
    return convertResultToDisplayResult(
      func.fragmentView.fragment.outputs,
      result,
    )
  }

  /**
   * Executes a transaction on the contract. This is only supported for
   * mutable and payable functions.
   * @param func
   */
  async executeFunction(
    func: ExecutableFunctionConfiguration,
  ): Promise<ExecutionResult> {
    if (!this.signer) {
      throw new Error(
        'Wallet must be connected for signed transactions. Read-only calls and simulated transactions are available.',
      )
    }

    this.provider = await this.getProvider()
    const call = await this.prepareExecutableCall(func)
    delete call.overrides.from

    try {
      const tx = await this.signer.sendTransaction({
        to: call.to,
        data: call.data,
        ...call.overrides,
      })
      const rct = await tx.wait()
      if (rct) {
        return new ExecutionResult(func.contractInterface, rct)
      }
    } catch (e) {
      if (isCallException(e)) {
        return new ExecutionResult(func.contractInterface, {
          ...e.receipt,
          error: {
            message: e.shortMessage,
            address: e.receipt?.to ?? undefined,
            data: e.data ?? undefined,
          },
        })
      }
    }

    throw new Error('Failed to execute transaction')
  }

  /**
   * Executes all functions on the widget. When the function is read-only, the result
   * is returned. When the function is mutable, the transaction receipt is returned.
   */
  async execute(): Promise<Array<DisplayResult | ExecutionResult>> {
    const results = []
    for (const func of this.functions) {
      if (func.fragmentView.fragment.constant) {
        results.push(await this.readFunction(func))
        continue
      }
      results.push(await this.executeFunction(func))
    }
    return results
  }

  /**
   * Simulates all functions on the widget. When the function is read-only, the result
   * is derived by making a static call to the contract. When the function is mutable,
   * the transaction is simulated in the bundle.
   *
   * Important note: The read-only calls are not simulated. They are executed directly
   * on the contract. This is because the simulation API does not support static calls.
   */
  async simulate(): Promise<Array<DisplayResult | ExecutionResult>> {
    return this.simulateFunctions(this.functions)
  }

  /**
   * Simulates a single function on the widget. When the function is read-only, an error
   * is thrown because the simulation API does not support static calls. When the
   * function is mutable or payable, the transaction is simulated and the transaction
   * receipt is returned.
   *
   * @param func The function to simulate
   */
  async simulateFunction(
    func: ExecutableFunctionConfiguration,
  ): Promise<ExecutionResult> {
    if (!func.fragmentView.fragment.constant) {
      throw new Error('Static calls not supported for non-constant functions')
    }

    const simulationResults = await this.simulateFunctions([func])
    const simulationResult = simulationResults[0]
    if (simulationResult instanceof ExecutionResult) {
      return simulationResult
    }

    throw new Error('Failed to simulate transaction')
  }

  private async getProvider() {
    if (this.provider) {
      return this.provider
    }

    this.provider = await getProvider(this.signer?.provider, this.activeChainId)
    return this.provider
  }

  private async prepareExecutableCall(
    func: ExecutableFunctionConfiguration,
  ): Promise<ExecutableEVMCall> {
    const signer = this.signer
    const from =
      func.context.overrides?.from ||
      (await signer?.getAddress()) ||
      ZeroAddress
    const to = this.contractAddresses
      .get(this.activeChainId)
      ?.get(func.contractId)
    const data = func.fragmentView.encodeFunctionData()

    if (!to) {
      throw new Error('The current chain is not supported for this contract')
    }

    func.context.overrides = func.context.overrides || {}
    func.context.overrides.from = from
    return {
      to,
      data,
      overrides: func.context.overrides,
    }
  }

  private async simulateFunctions(
    functions: readonly ExecutableFunctionConfiguration[],
  ): Promise<Array<DisplayResult | ExecutionResult>> {
    const simulationBundleIndexes = []
    const simulationBundle = []
    const result: Array<DisplayResult | ExecutionResult> = Array(
      functions.length,
    ).fill(null)
    this.provider = await this.getProvider()

    for (let i = 0; i < functions.length; i++) {
      const func = functions[i]
      if (func.fragmentView.fragment.constant) {
        result[i] = await this.readFunction(func)
        continue
      }

      const call = await this.prepareExecutableCall(func)
      simulationBundle.push({
        to: call.to,
        data: call.data,
        simulationOverrides: func.context.simulationOverrides,
        overrides: call.overrides,
      })
      simulationBundleIndexes.push(i)
    }

    let receipts: ExecutionResultData[] | undefined = []
    if (simulationBundleIndexes.length) {
      receipts = await this._transactionSimulator.simulateBundle(
        this.activeChainId,
        simulationBundle,
      )
      if (!receipts?.length) {
        throw new Error('Failed to simulate transactions')
      }

      if (receipts.length !== simulationBundleIndexes.length) {
        throw new Error('Invalid simulation result')
      }
    }

    for (let i = 0; i < receipts.length; i++) {
      const rct = receipts[i]
      const funcIndex = simulationBundleIndexes[i]
      result[funcIndex] = new ExecutionResult(
        functions[funcIndex].contractInterface,
        rct,
      )
    }
    return result
  }
}

async function getExecutableFunctionConfigurations(
  dataManager: CollectionDataManager,
  functions: readonly string[],
): Promise<ExecutableFunctionConfiguration[]> {
  const result: ExecutableFunctionConfiguration[] = []
  for (const func of functions) {
    const contractId = func.split('.')[0]
    const fragmentView = await dataManager.getFunctionFragmentView(
      contractId,
      func,
    )
    if (!fragmentView) {
      throw new Error('Invalid function')
    }
    const contractInterface = dataManager.contractManagerView.getInterface(
      dataManager.contractManagerView.getContract(contractId)!.interfaceHash,
    )!

    result.push({
      contractId,
      fragmentView,
      contractInterface,
      context: {
        overrides: {},
        simulationOverrides: {
          accounts: [],
        },
      },
    })
  }
  return result
}

function getActiveNetworks(
  dataManager: CollectionDataManager,
  functions: readonly string[],
) {
  const contractIds = new Set(functions.map((f) => f.split('.')[0]))
  let activeNetworks: Set<number> | undefined
  for (const contractId of contractIds) {
    const contract = dataManager.contractManagerView.getContract(contractId)
    if (!contract) {
      throw new Error('Invalid contract ID')
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
  return activeNetworks!
}
