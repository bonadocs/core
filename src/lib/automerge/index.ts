import { NetworkAdapterInterface, Repo } from '@automerge/automerge-repo'

import { lock } from '../util/lock'

import { BonadocsClientNetworkAdapter } from './network-adapter'
import { BonadocsClientStorageAdapter } from './storage-adapter'

const repos: Map<string, Repo> = new Map()

export async function getAutomergeRepo(apiData?: {
  projectId: number
  collectionId: number
}) {
  const networks: NetworkAdapterInterface[] = []
  let repo: Repo
  if (apiData) {
    const network = await BonadocsClientNetworkAdapter.getNetworkAdapter(
      apiData.projectId,
      apiData.collectionId,
    )
    networks.push(network as unknown as NetworkAdapterInterface)
    repo = await getRepo(apiData.projectId, apiData.collectionId, networks)
    await repo.networkSubsystem.whenReady()
    const docId = await network.docIdPromise
    return { repo, docId }
  } else {
    repo = new Repo({
      storage: new BonadocsClientStorageAdapter(),
    })
    return { repo, docId: null }
  }
}

async function getRepo(
  projectId: number,
  collectionId: number,
  networks: NetworkAdapterInterface[],
) {
  const key = `${projectId}:${collectionId}`
  return lock(`create-repo-${key}`, async () => {
    if (repos.has(key)) {
      return repos.get(key)!
    }
    const repo = new Repo({
      network: networks,
      storage: new BonadocsClientStorageAdapter(),
    })
    repos.set(key, repo)
    return repo
  })
}
