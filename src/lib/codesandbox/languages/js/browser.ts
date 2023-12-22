import { JavaScriptCodeRunner } from './base'

export class BrowserJSCodeRunner extends JavaScriptCodeRunner {
  constructor() {
    super()
  }

  protected async loadScriptFromUrl(url: string): Promise<string> {
    const key = `script:${url}`
    const cached = localStorage.getItem(key)
    if (cached) {
      return cached
    }
    const response = await fetch(url)
    const text = await response.text()
    localStorage.setItem(key, text)
    return text
  }

  protected buildScript(code: string, baseScript: string): string {
    return `${baseScript};

async function run() {
  ${code}
}

run().then((result) => {
  self.postMessage({ result })
}).catch((error) => {
  self.postMessage({ error })
})`
  }

  protected runScript(script: string): Promise<unknown> {
    const blob = new Blob([script], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    const worker = new Worker(workerUrl)

    return new Promise((resolve, reject) => {
      worker.onmessage = function (e) {
        const { error, result } = e.data
        worker.terminate()

        if (error) {
          return reject(error)
        }

        resolve(result)
      }
    })
  }
}
