import {
  Chunk,
  StorageAdapterInterface,
  StorageKey,
} from '@automerge/automerge-repo'

import { getAutomergeStore } from '../storage'

export class BonadocsClientStorageAdapter implements StorageAdapterInterface {
  async load(key: StorageKey): Promise<Uint8Array | undefined> {
    const storageApi = await getAutomergeStore()
    const data = await storageApi.get(key)
    return data ?? undefined
  }

  async save(key: StorageKey, data: Uint8Array): Promise<void> {
    const storageApi = await getAutomergeStore()
    await storageApi.set(key, data)
  }

  async remove(key: StorageKey): Promise<void> {
    const storageApi = await getAutomergeStore()
    await storageApi.remove(key)
  }

  async loadRange(keyPrefix: StorageKey): Promise<Chunk[]> {
    const storageApi = await getAutomergeStore()
    const result = await storageApi.getRange(keyPrefix)
    return (
      result?.map((r) => ({
        key: r.key as string[],
        data: r.data as Uint8Array,
      })) ?? []
    )
  }

  async removeRange(keyPrefix: StorageKey): Promise<void> {
    const storageApi = await getAutomergeStore()
    await storageApi.removeRange(keyPrefix)
  }
}
