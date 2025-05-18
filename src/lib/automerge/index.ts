import { NetworkAdapterInterface, Repo } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'

import { BonadocsClientStorageAdapter } from './storage-adapter'

export async function getAutomergeRepo(apiData?: {
  projectId: number
  collectionId: number
}) {
  const networks: NetworkAdapterInterface[] = []
  if (apiData) {
    networks.push(
      new BrowserWebSocketClientAdapter(
        'wss://sync.automerge.org',
      ) as unknown as NetworkAdapterInterface,
    )
  }

  const repo = new Repo({
    network: networks,
    storage: new BonadocsClientStorageAdapter(),
  })
  await repo.networkSubsystem.whenReady()
  return repo
}
