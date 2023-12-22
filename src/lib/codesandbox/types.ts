export abstract class CodeRunner {
  readonly #language: string

  protected constructor(language: string) {
    this.#language = language
  }

  get language() {
    return this.#language
  }

  abstract run(code: string): Promise<unknown>
}
