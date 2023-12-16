﻿import { JsonRpcProvider, ParamType, Provider, Result } from 'ethers'

import { supportedChains } from '../../chains'

export type DisplayResult = Array<{
  name: string | null
  value: unknown
}>

export async function getProvider(
  connectedProvider: Provider | null | undefined,
  chainId: number,
): Promise<Provider> {
  const provider = connectedProvider || getProviderFromChainId(chainId)
  if (!provider) {
    throw new Error(
      'Unsupported chain. Please connect your wallet to the correct network.',
    )
  }

  if (await validateProviderChainId(chainId, provider)) {
    return provider
  }

  if (provider !== connectedProvider) {
    throw new Error(`Invalid JSON RPC URL for network`)
  }

  return getProvider(undefined, chainId)
}

export async function validateProviderChainId(
  chainId: number,
  provider: Provider,
): Promise<boolean> {
  const providerNetwork = await provider.getNetwork()
  return providerNetwork.chainId === BigInt(chainId)
}

export function convertResultToDisplayResult(
  paramTypes: ReadonlyArray<ParamType>,
  result: Result,
): DisplayResult {
  if (paramTypes.length !== result.length) {
    throw new Error('Invalid result for ABI interface')
  }

  const displayResult: DisplayResult = []
  for (let i = 0; i < result.length; i++) {
    displayResult.push({
      name: paramTypes[i].name || null,
      value: result[i],
    })
  }
  return displayResult
}

function getProviderFromChainId(chainId: number) {
  const jsonRpcUrl = supportedChains.get(chainId)?.jsonRpcUrl
  if (jsonRpcUrl) {
    return new JsonRpcProvider(jsonRpcUrl)
  }

  return null
}
