import { getExecutionEnvironment } from '../../../collection/execution/util'

import { JavaScriptCodeRunner } from './base'

let codeRunner: JavaScriptCodeRunner | undefined

export async function getCodeRunner(): Promise<JavaScriptCodeRunner> {
  if (codeRunner) {
    return codeRunner
  }

  const executionEnvironment = getExecutionEnvironment()
  if (executionEnvironment === 'browser') {
    const { BrowserJSCodeRunner } = await import('./browser')
    codeRunner = new BrowserJSCodeRunner()
  } else if (executionEnvironment === 'node') {
    const { NodeJSRunner } = await import('./node')
    codeRunner = new NodeJSRunner()
  } else {
    throw new Error('Unsupported environment for running JavaScript code')
  }
  return codeRunner
}
