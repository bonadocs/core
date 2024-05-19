export type LanguageSpecificHandlerArgs = {
  [key: string]: unknown
}

export type CodeRunnerContextItem<TValue> =
  | {
      serializable: true
      name: string
      type: string
      value: TValue
    }
  | {
      serializable: false
      name: string
      type: string
      value: TValue
      registerHandler: {
        [k: string]: (args: LanguageSpecificHandlerArgs) => void
      }
      injectedCode: string
    }

export type CodeRunnerContext = Record<string, CodeRunnerContextItem<unknown>>

export abstract class CodeRunner {
  readonly #language: string

  protected constructor(language: string) {
    this.#language = language
  }

  get language() {
    return this.#language
  }

  abstract loadLibrary(name: string): Promise<void>
  abstract run(code: string, context: CodeRunnerContext): Promise<unknown>
}
