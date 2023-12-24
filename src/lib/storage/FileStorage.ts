import fs from 'fs/promises'
import path from 'path'

import { StorageAPI } from './StorageAPI'

class FileStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileStorageError'
  }
}

export class FileStorage implements StorageAPI {
  private readonly filePath: string
  private isSetup = false

  private constructor(
    private readonly directory: string,
    storeName: string,
    private readonly createIfNotExists: boolean,
  ) {
    this.filePath = path.join(directory, `${storeName}.json`)
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
      await this.ensureFileExists()
    }
    this.isSetup = true
  }

  private async ensureDirectoryExists() {
    try {
      await fs.access(this.directory)
    } catch {
      try {
        await fs.mkdir(this.directory, { recursive: true })
      } catch (error) {
        throw new FileStorageError(
          `Failed to create directory: ${
            !!error && typeof error === 'object' && 'message' in error
              ? error.message
              : 'An unknown error occurred'
          }`,
        )
      }
    }
  }

  private async ensureFileExists() {
    try {
      await fs.access(this.filePath)
    } catch {
      try {
        await fs.writeFile(this.filePath, JSON.stringify({}))
      } catch (error) {
        throw new FileStorageError(
          `Failed to create file: ${
            !!error && typeof error === 'object' && 'message' in error
              ? error.message
              : 'An unknown error occurred'
          }`,
        )
      }
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const data = JSON.parse(await fs.readFile(this.filePath, 'utf8'))
      return data[key] || null
    } catch (error) {
      throw new FileStorageError(
        `Failed to get data: ${
          error instanceof Error ? error.message : 'An unknown error occurred'
        }`,
      )
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const data = JSON.parse(await fs.readFile(this.filePath, 'utf8'))
      data[key] = value
      await fs.writeFile(this.filePath, JSON.stringify(data))
    } catch (error) {
      throw new FileStorageError(
        `Failed to set data: ${
          !!error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'An unknown error occurred'
        }`,
      )
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const data = JSON.parse(await fs.readFile(this.filePath, 'utf8'))
      delete data[key]
      await fs.writeFile(this.filePath, JSON.stringify(data))
    } catch (error) {
      throw new FileStorageError(
        `Failed to remove data: ${
          !!error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'An unknown error occurred'
        }`,
      )
    }
  }
}
