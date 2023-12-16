import {
  Interface,
  Provider,
  Signer,
  TransactionReceiptParams,
  ZeroAddress,
} from 'ethers'

import { FunctionFragmentView } from '../data-manager'
import { TransactionSimulator } from '../simulation'
import { ExecutableEVMCall, ExecutionContext } from '../spec'

import { TransactionReceiptWithParsedLogs } from './TransactionReceiptWithParsedLogs'
import {
  convertResultToDisplayResult,
  DisplayResult,
  getProvider,
} from './util'

interface ExecutableFunctionConfiguration {
  address: string
  contractInterface: Interface
  fragmentView: FunctionFragmentView
  context: ExecutionContext
}

export class Executor {
  private readonly functions: readonly ExecutableFunctionConfiguration[]
  private readonly chainId: number
  private readonly _transactionSimulator: TransactionSimulator
  private signer: Signer | null = null
  private provider: Provider | null = null

  constructor(chainId: number, functions: ExecutableFunctionConfiguration[]) {
    this.chainId = chainId
    this._transactionSimulator = new TransactionSimulator()
    this.functions = functions
  }

  /**
   * Sets the signer to use for signed transactions.
   * @param signer
   */
  setSigner(signer: Signer) {
    this.signer = signer
  }

  async resetProvider() {
    this.provider = null
    await this.getProvider()
  }

  /**
   * Sets the execution context for a function. The execution context determines the
   * overrides the function will use when executing.
   *
   * @param index The index of the function to set the execution context for
   * @param executionContext The execution context to set
   */
  setExecutionContext(index: number, executionContext: ExecutionContext) {
    this.functions[index].context = executionContext
  }

  get functionViews(): readonly FunctionFragmentView[] {
    return this.functions.map((func) => func.fragmentView)
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

    const result = func.fragmentView.decodeResult(
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
  ): Promise<TransactionReceiptWithParsedLogs> {
    if (!func.fragmentView.fragment.constant) {
      throw new Error('Static calls not supported for non-constant functions')
    }

    if (!this.signer) {
      throw new Error(
        'Wallet must be connected for signed transactions. Read-only calls and simulated transactions are available.',
      )
    }

    this.provider = await this.getProvider()
    const call = await this.prepareExecutableCall(func)
    const tx = await this.signer.sendTransaction({
      from: call.overrides.from,
      to: call.to,
      data: call.data,
      ...call.overrides,
    })
    const rct = await tx.wait()
    if (!rct) {
      throw new Error('Failed to execute transaction')
    }
    return new TransactionReceiptWithParsedLogs(func.contractInterface, rct)
  }

  /**
   * Executes all functions on the widget. When the function is read-only, the result
   * is returned. When the function is mutable, the transaction receipt is returned.
   */
  async execute(): Promise<
    Array<DisplayResult | TransactionReceiptWithParsedLogs>
  > {
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
  async simulate(): Promise<
    Array<DisplayResult | TransactionReceiptWithParsedLogs>
  > {
    return this.simulateFunctions(this.functions)
  }

  /**
   * Simulates a single function on the widget. When the function is read-only, an error is
   * thrown because the simulation API does not support static calls. When the function is
   * mutable or payable, the transaction is simulated and the transaction receipt is returned.
   *
   * @param func The function to simulate
   */
  async simulateFunction(
    func: ExecutableFunctionConfiguration,
  ): Promise<TransactionReceiptWithParsedLogs> {
    if (!func.fragmentView.fragment.constant) {
      throw new Error('Static calls not supported for non-constant functions')
    }

    const simulationResults = await this.simulateFunctions([func])
    const simulationResult = simulationResults[0]
    if (simulationResult instanceof TransactionReceiptWithParsedLogs) {
      return simulationResult
    }

    throw new Error('Failed to simulate transaction')
  }

  private async getProvider() {
    if (this.provider) {
      return this.provider
    }

    this.provider = await getProvider(this.signer?.provider, this.chainId)
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
    const to = func.address
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
  ): Promise<Array<DisplayResult | TransactionReceiptWithParsedLogs>> {
    const simulationBundleIndexes = []
    const simulationBundle = []
    const result: Array<DisplayResult | TransactionReceiptWithParsedLogs> =
      Array(functions.length).fill(null)
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

    let receipts: TransactionReceiptParams[] | undefined = []
    if (simulationBundleIndexes.length) {
      receipts = await this._transactionSimulator.simulateBundle(
        this.chainId,
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
      result[funcIndex] = new TransactionReceiptWithParsedLogs(
        functions[funcIndex].contractInterface,
        rct,
      )
    }
    return result
  }
}
