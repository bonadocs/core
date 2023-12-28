import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { File, NFTStorage } from 'nft.storage'

import { config } from '../config'

const ipfsGateways = [
  'https://ipfs.io',
  'https://gateway.ipfs.io',
  'https://dweb.link',
  'https://cf-ipfs.com',
  'https://cloudflare-ipfs.com',
  'https://hardbin.com',
  'https://ipfs.nftstorage.link',
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
  const clients = getClients()
  for (let i = 0; i < clients.length; i++) {
    const j = count % clients.length
    try {
      const result = await loadFromSingleClient(clients[j], cid)
      if (result?.data) {
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
  // generate key and iv
  const cid = await nftStorage.storeBlob(
    new File([new TextEncoder().encode(data)], ''),
  )
  return `ipfs://${cid}`
}
