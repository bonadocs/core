import { CodeRunner, getCodeRunner } from '../../codesandbox'
import { CollectionDataManager } from '../data-manager'
import { CodeSnippet, CodeSnippetLanguage } from '../spec'

import { getDefaultLibraries, getExecutionType } from './util'

interface CodeWorkflowConfiguration {
  snippets: CodeSnippet[]
  variables: Record<string, string>
}

export class CodeWorkflowExecutor {
  #currentLanguage: CodeSnippetLanguage
  readonly #runners: Record<CodeSnippetLanguage, CodeRunner>
  readonly #snippets: Record<CodeSnippetLanguage, string>

  private constructor(
    config: CodeWorkflowConfiguration,
    runners: Record<CodeSnippetLanguage, CodeRunner>,
  ) {
    this.#runners = runners
    this.#snippets = Object.fromEntries(
      config.snippets.map((s) => [s.language, s.code]),
    ) as Record<CodeSnippetLanguage, string>
    this.#currentLanguage = config.snippets[0].language
  }

  static async create(
    dataManager: CollectionDataManager,
    codeWorkflowId: string,
    libraries: Record<CodeSnippetLanguage, string[]> = {
      js: getDefaultLibraries('js'),
    },
  ): Promise<CodeWorkflowExecutor> {
    const workflow = dataManager.workflowManagerView.getWorkflow(codeWorkflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${codeWorkflowId}`)
    }

    const executionType = getExecutionType(workflow.execution)
    if (executionType !== 'snippet') {
      throw new Error(
        'Only code snippet workflows are supported in this context',
      )
    }

    const snippets = workflow.execution as CodeSnippet[]
    const config = {
      snippets,
      variables: Object.fromEntries([
        ...dataManager.environmentManagerView.list,
        ...workflow.variables.map((v) => [v.name, v.value]),
      ]),
    }

    const runners = Object.fromEntries(
      await Promise.all(
        snippets.map(async (s) => [
          s.language,
          await getCodeRunner(s.language).then((r) => {
            let promise = Promise.resolve()
            for (const library of libraries[s.language]) {
              promise = promise.then(() => r.loadLibrary(library))
            }
            return promise
          }),
        ]),
      ),
    )
    return new CodeWorkflowExecutor(config, runners)
  }

  loadLibrary(language: CodeSnippetLanguage, library: string) {
    return this.#runners[language].loadLibrary(library)
  }

  async run(): Promise<unknown> {
    const runner = this.#runners[this.#currentLanguage]
    return runner.run(this.#snippets[this.#currentLanguage], {})
  }
}
