import { NetworkAdapterInterface, Repo } from '@automerge/automerge-repo'

import { BonadocsClientNetworkAdapter } from './network-adapter'
import { BonadocsClientStorageAdapter } from './storage-adapter'

export async function getAutomergeRepo(apiData?: {
  projectId: number
  collectionId: number
}) {
  const networks: NetworkAdapterInterface[] = []
  if (apiData) {
    networks.push(
      BonadocsClientNetworkAdapter.getNetworkAdapter(
        apiData.projectId,
        apiData.collectionId,
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
