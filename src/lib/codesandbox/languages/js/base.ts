import { CodeRunner } from '../../types'

export abstract class JavaScriptCodeRunner extends CodeRunner {
  #baseScript: string | undefined
  #libraries = [
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.9.1/ethers.umd.min.js',
  ]

  protected constructor() {
    super('js')
  }

  async run(code: string): Promise<unknown> {
    const script = this.buildScript(code, await this.loadBaseScript())
    return this.runScript(script)
  }

  private async loadBaseScript(): Promise<string> {
    if (this.#baseScript) {
      return this.#baseScript
    }

    let script = ''
    for (const url of this.#libraries) {
      script += (await this.loadScriptFromUrl(url)) + ';\n'
    }
    this.#baseScript = script
    return script
  }

  protected abstract loadScriptFromUrl(url: string): Promise<string>
  protected abstract buildScript(code: string, baseScript: string): string
  protected abstract runScript(script: string): Promise<unknown>
}
