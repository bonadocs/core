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

console = bonadocs['console'];

async function run() {
  ${code}
}

run().then((result) => {
  self.postMessage({ result: {value: result} });
}).catch((error) => {
  self.postMessage({ error });
});`
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
          i.registerHandler.js && {
            name: i.name,
            func: (message: unknown) =>
              i.registerHandler.js({ worker, message }),
          },
      )
      .filter(Boolean) as { name: string; func: (message: unknown) => void }[]

    return new Promise((resolve, reject) => {
      worker.onmessage = function (e) {
        const { error, result } = e.data

        if (error) {
          worker.terminate()
          return reject(error)
        }

        if (result) {
          worker.terminate()
          return resolve(result.value)
        }

        const { handler: handlerName, data } = e.data

        if (!handlerName) {
          return reject(new Error('No handler provided'))
        }

        for (const handler of handlers) {
          if (handler.name === handlerName) {
            handler.func(data)
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
