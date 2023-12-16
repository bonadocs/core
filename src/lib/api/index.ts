import axios, { AxiosInstance } from 'axios'
import { TransactionReceiptParams } from 'ethers'

import { ExecutableEVMCall } from '../collection'
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
    })
  }

  async loadContractSpec(
    chainCode: string,
    address: string,
  ): Promise<string | undefined> {
    try {
      const response = await this.client.get(
        `/contract?address=${address}&chain=${chainCode}`,
      )
      if (response.data?.data?.spec) {
        return response.data.data.spec
      }
    } catch (e) {
      console.error(e)
    }
    return undefined
  }

  async simulateEVMBundle(
    chainCode: string,
    calls: ExecutableEVMCall[],
  ): Promise<TransactionReceiptParams[] | undefined> {
    try {
      const response = await this.client.post(
        `/simulate?chain=${chainCode}`,
        calls,
      )
      if (Array.isArray(response.data?.data)) {
        return response.data.data
      }
    } catch (e) {
      console.error(e)
    }
    return undefined
  }
}

let api: BonadocsAPI | undefined
export function getApi(url?: string): BonadocsAPI | undefined {
  if (api) {
    return api
  }

  if (!url) {
    return undefined
  }

  api = new BonadocsAPI(url)
  return api
}
