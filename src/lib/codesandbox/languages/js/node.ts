import * as vm from 'vm'

import { CodeRunnerContext } from '../../types'

import { JavaScriptCodeRunner } from './base'

export class NodeJSRunner extends JavaScriptCodeRunner {
  constructor() {
    super()
  }

  protected buildScript(code: string, baseScript: string): string {
    return `${baseScript};

async function run() {
  ${code}
}

run().then((result) => {
  onBonadocsExecutionSuccess(result)
}).catch((error) => {
  onBonadocsExecutionError(error)
})`
  }

  protected runScript(
    script: string,
    codeRunnerContext: CodeRunnerContext,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const context = {
        onBonadocsExecutionSuccess: (
          result: Record<string, unknown> | undefined,
        ) => {
          resolve(result)
        },
        onBonadocsExecutionError: (error: unknown) => {
          reject(error)
        },
        // to enable logging from the code
        console,
        // needed for Ethers
        global: {
          crypto,
        },
        bonadocs: {
          ...Object.values(codeRunnerContext).reduce(
            (acc, { name, value }) => {
              acc[name] = value
              return acc
            },
            {} as Record<string, unknown>,
          ),
        },
      }
      vm.createContext(context)
      vm.runInContext(script, context)
    })
  }
}
