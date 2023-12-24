export type TransactionFunction = (store: StorageAPI) => Promise<void>
export type StorageAPI = {
  readonly get: (key: string) => Promise<string | null>
  readonly set: (key: string, value: string) => Promise<void>
  readonly remove: (key: string) => Promise<void>
  readonly transaction: (func: TransactionFunction) => Promise<void>
}
