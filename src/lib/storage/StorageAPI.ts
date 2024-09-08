export type TransactionFunction = (store: StorageAPI) => Promise<void>
export type StorageKey = string[]
export type StorageData = Uint8Array

export type RangeItem = {
  readonly key: StorageKey
  readonly data: StorageData
}

export type StorageAPI = {
  readonly get: (key: StorageKey) => Promise<StorageData | null>
  readonly getRange: (prefix: StorageKey) => Promise<RangeItem[] | null>
  readonly set: (key: StorageKey, value: StorageData) => Promise<void>
  readonly remove: (key: StorageKey) => Promise<void>
  readonly removeRange: (prefix: StorageKey) => Promise<void>
  readonly transaction: (func: TransactionFunction) => Promise<void>
}
