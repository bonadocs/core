import { isCallException } from 'ethers'

import { getApi } from '../../api'
import { getProvider } from '../execution/util'
import { ExecutableEVMCall } from '../spec'
import { ExecutionResultData } from '../types'

/**
 * This class is maintained separately rather than just relying on the API object because
 * we want to make this happen directly on the client eventually and eliminate a need for
 * a central API service to process simulations.
 */
export class TransactionSimulator {
  async simulateBundle(
    chainId: number,
    calls: ExecutableEVMCall[],
  ): Promise<ExecutionResultData[] | undefined> {
    const api = getApi()
    if (!api) {
      throw new Error('Simulation API must be setup')
    }

    const responses = await api.simulateEVMBundle(chainId, calls)
    if (!responses) {
      return responses
    }

    const results: ExecutionResultData[] = []
    for (const response of responses) {
      if (!response.error) {
        results.push(response.receipt)
        continue
      }

      results.push({
        ...response.receipt,
        error: response.error,
      })
    }

    if (results.length === 1 && results[0].error && !results[0].error.data) {
      results[0].error.data =
        (await this.#tryGetErrorData(chainId, calls[0])) || undefined
    }
    return results
  }

  /**
   * Implemented only for a single call case. If there are multiple calls, we cannot reliably re-create
   * the state of the EVM to get the error data until we have a full simulation API.
   *
   * @param chainId
   * @param call
   * @private
   */
  async #tryGetErrorData(
    chainId: number,
    call: ExecutableEVMCall,
  ): Promise<string | null> {
    try {
      const provider = await getProvider(null, chainId)
      await provider.call({
        from: call.overrides.from,
        to: call.to,
        data: call.data,
        chainId,
        value: call.overrides.value,
        gasLimit: call.overrides.gasLimit,
        gasPrice: call.overrides.gasPrice,
      })
    } catch (e) {
      if (isCallException(e)) {
        return e.data
      }
    }
    return null
  }
}
