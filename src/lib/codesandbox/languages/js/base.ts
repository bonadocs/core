import { getCodeCacheStore } from '../../../storage'
import { CodeRunner, CodeRunnerContext } from '../../types'

const libraryFormatRegex =
  /^(?:@([A-Za-z0-9_\-.~]+)\/)?([A-Za-z0-9_\-.~]+)(?:@([A-Za-z0-9_\-.~]+))?$/
export abstract class JavaScriptCodeRunner extends CodeRunner {
  #libraryCode: Record<string, string> = {}

  protected constructor() {
    super('js')
  }

  async run(code: string, context: CodeRunnerContext): Promise<unknown> {
    const script = this.buildScript(code, await this.loadBaseScript(), context)
    return this.runScript(script, context)
  }

  async loadLibrary(name: string): Promise<void> {
    console.log('Loading JS library:', name)
    const url = name
    if (url.startsWith('http')) {
      this.#libraryCode[name] = await this.loadScriptFromUrl(url)
      console.log('Loaded JS library:', name)
      return
    }

    const match = name.match(libraryFormatRegex)
    if (!match) {
      throw new Error(`Invalid library name: ${name}`)
    }

    const [, scope, packageName, version] = match
    if (!packageName) {
      throw new Error(
        `Invalid library name: ${name}. Failed to resolve package name`,
      )
    }
    const packageUrl = await this.getPackageUrl(scope, packageName, version)
    ;(this.#libraryCode[name] = await this.loadScriptFromUrl(packageUrl)),
      console.log('Loaded JS library:', name)
  }

  private async loadBaseScript(): Promise<string> {
    let script = ''
    for (const [name, code] of Object.entries(this.#libraryCode)) {
      script += `
// Library: ${name}  - Bonadocs JS CodeRunner
// Beginning of library: ${name}
${code}
// End of library: ${name}
`
    }

    script += `
function getConsoleLogReplacer() {
  const seen = new WeakSet()
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }

    if (typeof value === 'bigint') {
      return '(bigint) ' + value.toString()
    }

    if (value instanceof Uint8Array) {
      return (
        '(Uint8Array) 0x' +
        Array.from(value)
          .map((x) => x.toString(16).padStart(2, '0'))
          .join('')
      )
    }
    return value
  }
}
`
    return script
  }

  private async getPackageUrl(
    scope: string | undefined,
    packageName: string,
    version: string | undefined,
  ): Promise<string> {
    const metadata = await this.loadPackageMetadata(scope, packageName)
    version ??= metadata.tags.latest

    if (!version) {
      throw new Error(
        `No version found for package: ${packageName} with scope ${scope}`,
      )
    }

    const versionMetadata = await this.loadVersionMetadata(
      scope,
      packageName,
      version,
    )
    if (!versionMetadata) {
      throw new Error(
        `Could not load version metadata for package: ${packageName} with scope ${scope}`,
      )
    }

    const umdFiles = versionMetadata.files.filter(
      (file: { name: string }) =>
        file.name.endsWith('.umd.min.js') || file.name.endsWith('.umd.js'),
    )
    umdFiles.sort((a: { name: string }, b: { name: string }) => {
      const aPoints = a.name.endsWith('.min.js') ? 2 : 1
      const bPoints = b.name.endsWith('.min.js') ? 2 : 1

      return bPoints - aPoints
    })

    const packageJsDelivrRoot = `https://cdn.jsdelivr.net/npm/${
      scope ? `@${scope}/` : ''
    }${packageName}@${version}`

    const umdFile = umdFiles[0]
    if (umdFile) {
      return packageJsDelivrRoot + umdFile.name
    }

    const entrypointsResponse = await fetch(versionMetadata.links.entrypoints)
    const entrypointsData = await entrypointsResponse.json()

    return packageJsDelivrRoot + entrypointsData.entrypoints.js.file
  }

  private async loadPackageMetadata(
    scope: string | undefined,
    packageName: string,
  ): Promise<Record<string, any>> {
    const scopeUrl = scope ? `@${scope}/` : ''
    const jsdelivrUrl = `https://data.jsdelivr.com/v1/package/npm/${scopeUrl}${packageName}`
    const response = await fetch(jsdelivrUrl)
    return response.json()
  }

  private async loadVersionMetadata(
    scope: string | undefined,
    packageName: string,
    version: string,
  ): Promise<Record<string, any>> {
    const scopeUrl = scope ? `@${scope}/` : ''
    const jsdelivrUrl = `https://data.jsdelivr.com/v1/package/npm/${scopeUrl}${packageName}@${version}?structure=flat`
    const response = await fetch(jsdelivrUrl)
    return response.json()
  }

  protected async loadScriptFromUrl(url: string): Promise<string> {
    console.log('Loading JS script from URL:', url)
    const key = `script:${url}`
    const storage = await getCodeCacheStore()
    const cached = await storage.get(key)
    if (cached) {
      console.log('Found cached script:', url)
      return cached
    }
    const response = await fetch(url)
    if (response.status !== 200) {
      throw new Error(`Failed to load script from URL: ${url}`)
    }
    const text = await response.text()
    const code = text?.trim()
    if (!code) {
      throw new Error(`Empty script loaded from URL: ${url}`)
    }
    await storage.set(key, code)
    console.log('Downloaded script:', url)
    return code
  }

  protected abstract buildScript(
    code: string,
    baseScript: string,
    context: CodeRunnerContext,
  ): string
  protected abstract runScript(
    script: string,
    context: CodeRunnerContext,
  ): Promise<unknown>
}

// proxy wraps the object and sends it to the main execution context
