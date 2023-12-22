import { JavaScriptCodeRunner } from './base'

let codeRunner: JavaScriptCodeRunner | undefined

export async function getCodeRunner(): Promise<JavaScriptCodeRunner> {
  if (codeRunner) {
    return codeRunner
  }

  if (typeof window !== 'undefined' && typeof window.Worker !== undefined) {
    const { BrowserJSCodeRunner } = await import('./browser')
    codeRunner = new BrowserJSCodeRunner()
  } else if (typeof process === 'object' && process?.versions?.node) {
    const { NodeJSRunner } = await import('./node')
    codeRunner = new NodeJSRunner()
  } else {
    throw new Error('Unsupported environment for running JavaScript code')
  }
  return codeRunner
}
