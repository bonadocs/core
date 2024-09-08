import axios, { AxiosInstance } from 'axios'
import { id } from 'ethers'

import { config } from '../config'
import { getMetadataStore } from '../storage'

const ipfsGateways = [
  'https://gateway.pinata.cloud',
  'https://nftstorage.link',
  'https://ipfs.io',
  'https://dweb.link',
  'https://cloudflare-ipfs.com',
  'https://cf-ipfs.com',
  'https://ipfs.eth.aragon.network',
  'https://4everland.io',
  'https://w3s.link',
  'https://trustless-gateway.link',
]

type HttpResponse = {
  statusCode: number
  data: unknown
}

let clients: HttpClient[]

class HttpClient {
  #waiting: boolean = false
  #httpClient: AxiosInstance
  readonly #totalWaitTime = 5000

  constructor(private baseUrl: string) {
    this.#httpClient = axios.create({
      baseURL: baseUrl,
    })
  }

  /**
   * Get data from IPFS. If we run into a 429 error, we disable the client for
   * a short period of time.
   * @param path
   */
  async get(path: string): Promise<HttpResponse | undefined> {
    if (this.#waiting) {
      return undefined
    }

    const response = await this.#httpClient.get(`${this.baseUrl}${path}`)
    if (response.status === 429) {
      this.#waiting = true
      await new Promise((resolve) =>
        setTimeout(() => {
          this.#waiting = false
          resolve(undefined)
        }, this.#totalWaitTime),
      )
      return undefined
    }

    if (response.status !== 200) {
      throw new Error(`Request failed: ${response.status}`)
    }

    return {
      statusCode: response.status,
      data: response.data,
    }
  }

  getWithTimeout(
    path: string,
    timeoutMillis: number,
  ): Promise<HttpResponse | undefined> {
    return Promise.race([
      this.get(path),
      new Promise<HttpResponse>((_, reject) =>
        setTimeout(reject, timeoutMillis),
      ),
    ])
  }
}

const pinataClient = axios.create({
  baseURL: 'https://uploads.pinata.cloud/v3',
  headers: {
    Authorization: `Bearer ${config.pinataApiKey}`,
  },
  validateStatus: () => true,
})

function getClients(): HttpClient[] {
  if (!clients) {
    clients = ipfsGateways.map((gatewayUrl) => new HttpClient(gatewayUrl))
  }

  return clients
}

/**
 * Load data from IPFS. Will go over a list of IPFS gateways until it finds the
 * data. If data is found on a gateway, the gateway is re-used for subsequent
 * calls until it fails.
 * @param cid
 */
export async function loadFromIPFS(cid: string): Promise<unknown> {
  const cached = await loadIPFSDataFromCache(cid)
  if (cached) {
    return cached
  }

  const clients = getClients()
  try {
    return await raceResolved(
      clients.map((client) =>
        client
          .getWithTimeout(`/ipfs/${cid}`, 3000)
          .then((result) => result?.data),
      ),
      (result) => !!result,
    )
  } catch (e) {
    return undefined
  }
}

export async function loadFromIPFSWithTimeout(
  cid: string,
  timeoutMillis: number,
): Promise<unknown> {
  return await Promise.race([
    loadFromIPFS(cid),
    new Promise<void>((_, reject) => setTimeout(reject, timeoutMillis)),
  ])
}

export async function saveToIPFS(data: string): Promise<string> {
  const hash = id(data)

  const metadataStore = await getMetadataStore()
  const existing = await metadataStore.getString(`ipfs-hash:${hash}`)
  if (existing) {
    return existing
  }

  const form = new FormData()
  form.append('file', new Blob([data]))
  const response = await pinataClient.post('/files', data, {})
  if (response.status !== 200) {
    throw new Error(`Failed to save to IPFS: ${response.statusText}`)
  }
  const cid = await response.data.data.cid
  const uri = `ipfs://${cid}`
  await metadataStore.set(`ipfs-hash:${hash}`, uri)
  await cacheIPFSData(cid, data)
  return uri
}

async function loadIPFSDataFromCache(cid: string): Promise<unknown> {
  const metadataStore = await getMetadataStore()
  const data = await metadataStore.getString(`ipfs-data:${cid}`)
  if (!data) {
    return undefined
  }

  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

async function cacheIPFSData(cid: string, data: unknown): Promise<void> {
  const metadataStore = await getMetadataStore()
  await metadataStore.set(`ipfs-data:${cid}`, JSON.stringify(data))
}

function raceResolved<T>(
  promises: Array<Promise<T>>,
  checkResolved: (value: T) => boolean,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const rejections: unknown[] = []

    promises.forEach((promise) => {
      Promise.resolve(promise)
        .then((value) => {
          if (checkResolved(value)) {
            resolve(value)
          } else {
            rejections.push(value)
            if (rejections.length === promises.length) {
              reject(rejections)
            }
          }
        })
        .catch((e) => {
          rejections.push(e)
          if (rejections.length === promises.length) {
            reject(rejections)
          }
        })
    })
  })
}
