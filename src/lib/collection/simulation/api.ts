import axios, { AxiosInstance } from 'axios'
import { TransactionReceiptParams } from 'ethers'

import { jsonUtils } from '../../util'
import { ExecutableEVMCall } from '../spec'

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

  async simulateEVMBundle(
    chainId: number,
    calls: ExecutableEVMCall[],
  ): Promise<TransactionReceiptParams[] | undefined> {
    try {
      const response = await this.client.post(
        `/simulate?chain=evm:${chainId}`,
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

const url =
  'https://v7sbpz4erztmg3mb2ci6q4ctte0xhpne.lambda-url.eu-central-1.on.aws'
let api: BonadocsAPI | undefined
export function getApi(): BonadocsAPI | undefined {
  if (api) {
    return api
  }

  api = new BonadocsAPI(url)
  return api
}
