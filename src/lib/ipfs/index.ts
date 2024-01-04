import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { id } from 'ethers'
import { File, NFTStorage } from 'nft.storage'

import { config } from '../config'
import { getMetadataStore } from '../storage'

const ipfsGateways = [
  'https://ipfs.nftstorage.link',
  'https://ipfs.io',
  'https://gateway.ipfs.io',
  'https://dweb.link',
  'https://cf-ipfs.com',
  'https://cloudflare-ipfs.com',
  'https://hardbin.com',
]

let clients: AxiosInstance[]
let count = 0
const nftStorage = new NFTStorage({ token: config.nftStorageApiKey })

function getClients(): AxiosInstance[] {
  if (!clients) {
    clients = ipfsGateways.map((gatewayUrl) =>
      axios.create({
        baseURL: gatewayUrl,
      }),
    )
  }

  return clients
}

async function loadFromSingleClient(
  client: AxiosInstance,
  cid: string,
): Promise<AxiosResponse | undefined> {
  return await Promise.race([
    client.get(`/ipfs/${cid}`),
    new Promise<undefined>((_, reject) => setTimeout(reject, 1000)),
  ])
}

/**
 * Load data from IPFS. Will go over a list of IPFS gateways until it finds the data.
 * If data is found on a gateway, the gateway is re-used for subsequent calls until
 * it fails.
 * @param cid
 */
export async function loadFromIPFS(cid: string): Promise<unknown> {
  const cached = await loadIPFSDataFromCache(cid)
  if (cached) {
    return cached
  }

  const clients = getClients()
  for (let i = 0; i < clients.length; i++) {
    const j = count % clients.length
    try {
      const result = await loadFromSingleClient(clients[j], cid)
      if (result?.data) {
        await cacheIPFSData(cid, result.data)
        return result.data
      }
    } catch {
      // ignore
    }

    count++
  }
  return undefined
}

export async function loadFromIPFSWithTimeout(
  cid: string,
  timeoutMillis: number,
): Promise<unknown> {
  return await Promise.race([
    loadFromIPFS(cid),
    new Promise<undefined>((resolve) => setTimeout(resolve, timeoutMillis)),
  ])
}

export async function saveToIPFS(data: string): Promise<string> {
  const hash = id(data)

  const metadataStore = await getMetadataStore()
  const existing = await metadataStore.get(`ipfs-hash:${hash}`)
  if (existing) {
    return existing
  }

  const cid = await nftStorage.storeBlob(
    new File([new TextEncoder().encode(data)], ''),
  )
  const uri = `ipfs://${cid}`
  await metadataStore.set(`ipfs-hash:${hash}`, uri)
  await cacheIPFSData(cid, data)
  return uri
}

async function loadIPFSDataFromCache(cid: string): Promise<unknown> {
  const metadataStore = await getMetadataStore()
  const data = await metadataStore.get(`ipfs-data:${cid}`)
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
