import fs from 'fs/promises'
import path from 'path'

import { RangeItem, StorageAPI, StorageData, StorageKey } from './StorageAPI'

class FileStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileStorageError'
  }
}

export class FileStorage implements StorageAPI {
  private readonly dir: string
  private isSetup = false

  private constructor(
    directory: string,
    storeName: string,
    private readonly createIfNotExists: boolean,
  ) {
    this.dir = path.join(directory, `${storeName}-store`)
  }

  transaction(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  static async create(
    directory: string,
    storeName: string,
    createIfNotExists = true,
  ): Promise<FileStorage> {
    const storage = new FileStorage(directory, storeName, createIfNotExists)
    await storage.setup()
    return storage
  }

  private async setup() {
    if (this.isSetup) return

    if (this.createIfNotExists) {
      await this.ensureDirectoryExists()
    }
    this.isSetup = true
  }

  private async ensureDirectoryExists(path?: string) {
    path ??= this.dir
    try {
      await fs.access(path)
    } catch {
      try {
        await fs.mkdir(path, { recursive: true })
      } catch (error) {
        throw new FileStorageError(
          `Failed to create directory ('${path}'): ${
            !!error && typeof error === 'object' && 'message' in error
              ? error.message
              : 'An unknown error occurred'
          }`,
        )
      }
    }
  }

  async get(key: StorageKey): Promise<StorageData | null> {
    try {
      return await fs.readFile(this.keyToPath(key))
    } catch (error) {
      return null
    }
  }

  async getRange(prefix: StorageKey): Promise<RangeItem[] | null> {
    const content = await this.get(prefix)
    if (content) {
      return [{ key: prefix, data: content }]
    }

    try {
      const items: RangeItem[] = []
      await this.recursiveLoadRangeItems(this.keyToPath(prefix), items)
      return items
    } catch (error) {
      return null
    }
  }

  async set(key: StorageKey, value: StorageData): Promise<void> {
    const filePath = this.keyToPath(key)
    try {
      const dir = path.dirname(filePath)
      await this.ensureDirectoryExists(dir)
      await fs.writeFile(filePath, value)
    } catch (error) {
      throw new FileStorageError(
        `Failed to set data for ${filePath}: ${
          !!error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'An unknown error occurred'
        }`,
      )
    }
  }

  async remove(key: StorageKey): Promise<void> {
    try {
      await fs.unlink(this.keyToPath(key))
    } catch (error) {
      throw new FileStorageError(
        `Failed to remove data for ${this.keyToPath(key)}: ${
          !!error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'An unknown error occurred'
        }`,
      )
    }
  }

  async removeRange(prefix: StorageKey): Promise<void> {
    try {
      await fs.rm(this.keyToPath(prefix), { recursive: true, force: true })
    } catch (error) {
      throw new FileStorageError(
        `Failed to remove data for ${this.keyToPath(prefix)}: ${
          !!error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'An unknown error occurred'
        }`,
      )
    }
  }

  private keyToPath(key: StorageKey): string {
    return path.join(this.dir, ...key)
  }

  private async recursiveLoadRangeItems(dir: string, items: RangeItem[]) {
    const files = await fs.readdir(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        await this.recursiveLoadRangeItems(filePath, items)
      } else {
        const data = await fs.readFile(filePath)
        const relativePath = path.relative(this.dir, filePath)
        const key = relativePath.split(path.sep)
        items.push({ key, data })
      }
    }
  }
}
