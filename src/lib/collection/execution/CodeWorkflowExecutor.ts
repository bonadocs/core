import { CodeRunner, getCodeRunner } from '../../codesandbox'
import { CollectionDataManager, ContractManagerView } from '../data-manager'
import { CodeSnippet, CodeSnippetLanguage } from '../spec'
import { intersect } from '../util'

import { BaseExecutor } from './BaseExecutor'
import { getDefaultLibraries, getExecutionType } from './util'

interface CodeWorkflowConfiguration {
  snippets: CodeSnippet[]
  variables: Record<string, string>
}

export class CodeWorkflowExecutor extends BaseExecutor {
  #currentLanguage: CodeSnippetLanguage
  readonly #runners: Record<CodeSnippetLanguage, CodeRunner>
  readonly #snippets: Record<CodeSnippetLanguage, string>
  readonly #contractManagerView: ContractManagerView

  private constructor(
    supportedChains: Set<number>,
    config: CodeWorkflowConfiguration,
    runners: Record<CodeSnippetLanguage, CodeRunner>,
    contractManagerView: ContractManagerView,
  ) {
    super(supportedChains)
    this.#runners = runners
    this.#snippets = Object.fromEntries(
      config.snippets.map((s) => [s.language, s.code]),
    ) as Record<CodeSnippetLanguage, string>
    this.#currentLanguage = config.snippets[0].language
    this.#contractManagerView = contractManagerView
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

    return new CodeWorkflowExecutor(
      getActiveNetworks(dataManager),
      config,
      runners,
      dataManager.contractManagerView,
    )
  }

  loadLibrary(language: CodeSnippetLanguage, library: string) {
    return this.#runners[language].loadLibrary(library)
  }

  async run(): Promise<unknown> {
    const runner = this.#runners[this.#currentLanguage]
    return runner.run(this.#snippets[this.#currentLanguage], {
      contracts: {
        name: 'contracts',
        serializable: true,
        type: 'object',
        value: Object.fromEntries(
          Array.from(this.#contractManagerView.contracts)
            .filter((c) =>
              c.instances.some((i) => i.chainId === this.activeChainId),
            )
            .map((c) => {
              const contract = {
                id: c.id,
                name: c.name,
                chainId: this.activeChainId,
                address: c.instances.find(
                  (i) => i.chainId === this.activeChainId,
                )!.address,
              }
              return [
                [c.id, contract],
                [c.name, contract],
              ]
            })
            .flat(),
        ),
      },
    })
  }
}

function getActiveNetworks(dataManager: CollectionDataManager) {
  let activeNetworks: Set<number> | undefined
  for (const contract of dataManager.contractManagerView.contracts) {
    const chainIds = contract.instances.map((instance) => instance.chainId)
    if (!activeNetworks) {
      activeNetworks = new Set(chainIds)
    } else {
      activeNetworks = intersect(activeNetworks, chainIds)
    }
    if (activeNetworks.size === 0) {
      throw new Error('Workflow functions must be on the same networks')
    }
  }
  return activeNetworks!
}
