import axios, { AxiosInstance } from 'axios'
import { TransactionReceiptParams } from 'ethers'

import { ExecutableEVMCall } from '../collection'
import { config } from '../config'
import { jsonUtils } from '../util'

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
        `/contract?address=${address}&chainId=${chainId}`,
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
  ): Promise<TransactionReceiptParams[] | undefined> {
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
