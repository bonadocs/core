import os from 'os'
import path from 'path'
import * as vm from 'vm'

import { FileStorage } from '../../../storage/FileStorage'

import { JavaScriptCodeRunner } from './base'

const codeRoot = path.join(os.homedir(), '.bonadocs', 'cache')

export class NodeJSRunner extends JavaScriptCodeRunner {
  #storage: FileStorage | undefined

  constructor() {
    super()
  }

  protected async loadScriptFromUrl(url: string): Promise<string> {
    const key = `script:${url}`
    const storage = await this.getStorage()
    const cached = await storage.get(key)
    if (cached) {
      return cached
    }
    const response = await fetch(url)
    const text = await response.text()
    await storage.set(key, text)
    return text
  }

  protected buildScript(code: string, baseScript: string): string {
    return `${baseScript};

async function run() {
  ${code}
}

run().then((result) => {
  onSuccess(result)
}).catch((error) => {
  onError(error)
})`
  }

  protected runScript(script: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const context = {
        onSuccess: (result: Record<string, unknown> | undefined) => {
          resolve(result)
        },
        onError: (error: unknown) => {
          reject(error)
        },
        // to enable logging from the code
        console,
        // needed for Ethers
        global: {
          crypto,
        },
      }
      vm.createContext(context)
      vm.runInContext(script, context)
    })
  }

  private async getStorage(): Promise<FileStorage> {
    if (!this.#storage) {
      this.#storage = await FileStorage.create(codeRoot, 'code')
    }
    return this.#storage
  }
}
