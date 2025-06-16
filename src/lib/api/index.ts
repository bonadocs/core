import axios, { AxiosInstance } from 'axios'
import type { TransactionReceiptParams } from 'ethers'

import {
  CollectionData,
  ExecutableEVMCall,
  ExecutionError,
} from '../collection'
import { config, validateConfig } from '../config'
import { jsonUtils } from '../util'

export type SimulationResponseData = {
  error?: ExecutionError
  receipt: TransactionReceiptParams
}

class BonadocsAPI {
  readonly request: typeof this.client.request
  private readonly client: AxiosInstance
  private isAuthenticated = false

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
    this.request = this.client.request.bind(this.client)
  }

  async loadContractABI(
    chainId: number,
    address: string,
  ): Promise<string | undefined> {
    this.assertAuthenticated()
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

  async getWsToken(
    projectId: number,
    collectionId: number,
  ): Promise<string | null> {
    this.assertAuthenticated()
    try {
      const response = await this.client.post('/auth/ws', {
        projectId,
        collectionId,
      })

      const token = response.data?.data?.token
      if (typeof token === 'string') {
        return token
      } else if (token != null) {
        console.debug('Token expected to be a string', { token })
      }
    } catch {
      // ignore
    }
    return null
  }

  async simulateEVMBundle(
    chainId: number,
    calls: ExecutableEVMCall[],
  ): Promise<SimulationResponseData[] | undefined> {
    this.assertAuthenticated()
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
    this.assertAuthenticated()
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

  async registerDevice(
    projectId: number,
    collectionId: number,
    token: string,
    timestamp: number,
  ): Promise<void> {
    this.assertAuthenticated()
    await this.client.post(
      `/projects/${projectId}/collections/${collectionId}/register-device`,
      { token, timestamp },
    )
  }

  async createCollection(
    projectId: number,
    data: CollectionData,
  ): Promise<number | undefined> {
    this.assertAuthenticated()
    const addedCollection = await this.client.post(
      `projects/${projectId}/collections`,
      {
        name: data.name,
        isPublic: false,
        collectionData: data,
      },
    )
    return addedCollection.data?.data?.collectionId
  }

  authenticate(authToken: string) {
    this.client.defaults.headers['Authorization'] = `Bearer ${authToken}`
    this.isAuthenticated = true
  }

  assertAuthenticated() {
    if (!this.isAuthenticated) {
      throw new Error(
        'API client is not authenticated. Please call authenticate() first.',
      )
    }
  }
}

let api: BonadocsAPI | undefined
export function getApi(url?: string): BonadocsAPI {
  if (api) {
    return api
  }

  if (!url) {
    validateConfig()
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
