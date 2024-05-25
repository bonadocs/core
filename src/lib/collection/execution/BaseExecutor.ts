import { Signer } from 'ethers'

export abstract class BaseExecutor {
  protected signer: Signer | null = null
  readonly supportedChains: Set<number>
  #activeChainId: number

  protected constructor(supportedChains: Set<number>) {
    if (!supportedChains.size) {
      throw new Error('No supported chains')
    }

    this.supportedChains = supportedChains
    this.#activeChainId = this.supportedChains.values().next().value
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

    this.#activeChainId = chainId
  }

  get activeChainId() {
    return this.#activeChainId
  }
}
