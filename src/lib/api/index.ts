import axios, { AxiosInstance } from 'axios'
import { TransactionReceiptParams } from 'ethers'

import {
  CollectionData,
  ExecutableEVMCall,
  ExecutionError,
} from '../collection'
import { config } from '../config'
import { jsonUtils } from '../util'

export type SimulationResponseData = {
  error?: ExecutionError
  receipt: TransactionReceiptParams
}

class BonadocsAPI {
  private readonly client: AxiosInstance

  constructor(url: string) {
    this.client = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      transformRequest: (data) => JSON.stringify(data, jsonUtils.replacer),
      transformResponse: (data) => JSON.parse(data, jsonUtils.reviver),
      validateStatus: () => true,
    })
  }

  async loadContractABI(
    chainId: number,
    address: string,
  ): Promise<string | undefined> {
    try {
      const response = await this.client.get(
        `/contracts?address=${address}&chainId=${chainId}`,
      )
      if (response.data?.data?.abi) {
        return response.data.data.abi
      }
    } catch {
      // ignore
    }
    return undefined
  }

  async simulateEVMBundle(
    chainId: number,
    calls: ExecutableEVMCall[],
  ): Promise<SimulationResponseData[] | undefined> {
    try {
      const response = await this.client.post(
        `/simulate?chainId=${chainId}`,
        calls,
      )
      if (Array.isArray(response.data?.data)) {
        return response.data.data
      }
    } catch {
      // ignore
    }
    return undefined
  }

  async getCollectionData(
    projectId: number,
    collectionId: number,
  ): Promise<CollectionData | undefined> {
    try {
      const response = await this.client.get(
        `/projects/${projectId}/collections/${collectionId}/data`,
      )
      if (response.status === 200 && response.data?.data) {
        return response.data.data
      }
    } catch {
      // ignore
    }
    return undefined
  }

  setupAuth(authToken: string) {
    this.client.defaults.headers['Authorization'] = `Bearer ${authToken}`
  }
}

let api: BonadocsAPI | undefined
export function getApi(url?: string): BonadocsAPI {
  if (api) {
    return api
  }

  if (!url) {
    url = config.defaultAPIUrl
  }

  api = new BonadocsAPI(url)
  return api
}

export async function httpGet(url: string): Promise<unknown> {
  const response = await axios.get(url, {
    validateStatus: () => true,
  })
  return await response.data
}
