import { CodeRunnerContext } from '../../types'

import { JavaScriptCodeRunner } from './base'

export class BrowserJSCodeRunner extends JavaScriptCodeRunner {
  constructor() {
    super()
  }

  protected buildScript(
    code: string,
    baseScript: string,
    context: CodeRunnerContext,
  ): string {
    return `${baseScript};

${this.loadContextScript(context)}

async function run() {
  ${code}
}

run().then((result) => {
  self.postMessage({ result })
}).catch((error) => {
  self.postMessage({ error })
})`
  }

  protected runScript(
    script: string,
    context: CodeRunnerContext,
  ): Promise<unknown> {
    const blob = new Blob([script], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    const worker = new Worker(workerUrl)

    const handlers = Object.values(context)
      .map(
        (i) =>
          !i.serializable &&
          'js' in i.registerHandler.js &&
          ((message: unknown) => i.registerHandler.js({ worker, message })),
      )
      .filter(Boolean)

    return new Promise((resolve, reject) => {
      worker.onmessage = function (e) {
        const { error, result } = e.data
        worker.terminate()

        if (error) {
          return reject(error)
        }

        if (result) {
          return resolve(result)
        }

        for (const handler of handlers) {
          if (handler) {
            handler(e.data)
          }
        }
      }
    })
  }

  private loadContextScript(context: CodeRunnerContext): string {
    let script = `
const bonadocs = {};
`
    for (const [key, value] of Object.entries(context)) {
      if (!value.serializable) {
        script += `bonadocs['${key}'] = ${value.injectedCode};\n\n`
        continue
      }

      script += `bonadocs['${key}'] = ${JSON.stringify(value.value)};\n`
    }

    return script
  }
}
