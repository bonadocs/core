import {
  CodeRunner,
  getCodeRunner,
  LanguageSpecificHandlerArgs,
} from '../../codesandbox'
import { CollectionDataManager, ContractManagerView } from '../data-manager'
import { CodeSnippet, CodeSnippetLanguage } from '../spec'

import { BaseExecutor } from './BaseExecutor'
import { getExecutionType } from './util'

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

    const languages = snippets.map((s) => s.language)
    const libraries = Object.fromEntries(
      languages.map((l) => [l, dataManager.valueManagerView.getLibraries(l)]),
    )

    const runners = Object.fromEntries(
      await Promise.all(
        snippets.map(async (s) => [
          s.language,
          await getCodeRunner(s.language).then(async (r) => {
            for (const library of libraries[s.language]) {
              await r.loadLibrary(library)
            }
            await r.loadLibrary('@bonadocs/zimulatoor')
            return r
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

  async run() {
    const runner = this.#runners[this.#currentLanguage]
    const consoleLogs: unknown[] = []
    const executionResult = await runner.run(
      this.#snippets[this.#currentLanguage],
      {
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
                  abi: this.#contractManagerView.getContractInterface(
                    c.interfaceHash,
                  )!.abi,
                }
                return [
                  [c.id, contract],
                  [c.name, contract],
                ]
              })
              .flat(),
          ),
        },
        commonAbis: {
          name: 'commonAbis',
          serializable: true,
          type: 'object',
          value: {
            erc20: [
              'function name() public view returns (string)',
              'function symbol() public view returns (string)',
              'function decimals() public view returns (uint8)',
              'function totalSupply() public view returns (uint256)',

              'function balanceOf(address _owner) public view returns (uint256 balance)',
              'function transfer(address _to, uint256 _value) public returns (bool success)',
              'function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)',
              'function approve(address _spender, uint256 _value) public returns (bool success)',
              'function allowance(address _owner, address _spender) public view returns (uint256 remaining)',

              'event Transfer(address indexed _from, address indexed _to, uint256 _value)',
              'event Approval(address indexed _owner, address indexed _spender, uint256 _value)',
            ],
          },
        },
        console: {
          name: 'console',
          serializable: false,
          type: 'object',
          value: null,
          injectedCode: `
          {
            log: (...args) => {
              workerConsole.log(...args)
              self.postMessage({
                handler: 'console',
                data: {
                  type: 'log',
                  args: JSON.parse(JSON.stringify(Array.from(args), getConsoleLogReplacer(), 2))
                }
              })
            },
            error: (...args) => {
              workerConsole.error(...args)
              self.postMessage({
                handler: 'console',
                data: {
                  type: 'error',
                  args: JSON.parse(JSON.stringify(Array.from(args), getConsoleLogReplacer(), 2))
                }
              })
            },
            warn: (...args) => {
              workerConsole.warn(...args)
              self.postMessage({
                handler: 'console',
                data: {
                  type: 'warn',
                  args: JSON.parse(JSON.stringify(Array.from(args), getConsoleLogReplacer(), 2))
                }
              })
            },
          }
`,
          registerHandler: {
            js: (args: LanguageSpecificHandlerArgs) => {
              console.log(args.message)
              consoleLogs.push(args.message)
            },
          },
        },
      },
    )

    return { executionResult, consoleLogs }
  }
}

function getActiveNetworks(dataManager: CollectionDataManager) {
  let activeNetworks: Set<number> | undefined
  for (const contract of dataManager.contractManagerView.contracts) {
    const chainIds = contract.instances.map((instance) => instance.chainId)
    if (!activeNetworks) {
      activeNetworks = new Set(chainIds)
    } else {
      chainIds.forEach((chainId) => activeNetworks!.add(chainId))
    }
  }
  return activeNetworks!
}
