import { js } from './languages'
import { CodeRunner } from './types'

export function getCodeRunner(language: string): Promise<CodeRunner> {
  switch (language) {
    case 'js':
      return js.getCodeRunner()
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}
