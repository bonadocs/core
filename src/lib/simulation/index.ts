import { getApi } from '../api'
import { ExecutableEVMCall } from '../collection'

/**
 * This class is maintained separately rather than just relying on the API object because
 * we want to make this happen directly on the client eventually and eliminate a need for
 * a central API service to process simulations.
 */
export class TransactionSimulator {
  async simulateBundle(chainCode: string, calls: ExecutableEVMCall[]) {
    const api = getApi()
    if (!api) {
      throw new Error('Simulation API must be setup')
    }

    return await api.simulateEVMBundle(chainCode, calls)
  }
}
