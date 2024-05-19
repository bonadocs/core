import { JsonRpcProvider, ParamType, Provider, Result, toBeHex } from 'ethers'

import { supportedChains } from '../../chains'
import { CodeSnippet, CodeSnippetLanguage } from '../spec'

export type DisplayResult = Record<string, unknown>

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

  const displayResult: DisplayResult = {}
  for (let i = 0; i < result.length; i++) {
    displayResult[paramTypes[i].name || `value${i}`] =
      typeof result[i] === 'bigint' ? toBeHex(result[i]) : result[i]
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

export function getExecutionType(
  execution: string[] | CodeSnippet[] | undefined,
) {
  if (!execution?.length) {
    return
  }

  return typeof execution[0] === 'string' ? 'functions' : 'snippet'
}

const defaultLanguageLibrariesMap: Record<CodeSnippetLanguage, string[]> = {
  js: [
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.9.1/ethers.umd.min.js',
  ],
}

export function getDefaultLibraries(language: CodeSnippetLanguage) {
  return defaultLanguageLibrariesMap[language]
}
