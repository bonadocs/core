import {
  Interface,
  LogDescription,
  LogParams,
  toBeHex,
  TransactionReceiptParams,
} from 'ethers'

import { jsonUtils } from '../../util'
import { ExecutionResultData } from '../types'

import { convertResultToDisplayResult, DisplayResult } from './util'

export class ExecutionResult {
  readonly resultData: ExecutionResultData
  readonly #parsedLogs: ReadonlyArray<
    LogParams & {
      description?: LogDescription
      displayDescription?: DisplayResult
    }
  >
  readonly #parsedError?: ExecutionResultData['error'] & {
    displayError?: DisplayResult
  }

  constructor(contractInterface: Interface, rct: ExecutionResultData) {
    this.resultData = rct
    this.#parsedLogs = Object.freeze(
      rct.logs?.map((l) => {
        const logDescription = contractInterface.parseLog({
          topics: [...l.topics],
          data: l.data,
        })
        if (!logDescription) {
          return {
            index: l.index,
            topics: l.topics,
            data: l.data,
            address: l.address,
            blockHash: l.blockHash,
            transactionHash: l.transactionHash,
            transactionIndex: l.transactionIndex,
            blockNumber: l.blockNumber,
            removed: l.removed,
          }
        }

        return {
          index: l.index,
          topics: l.topics,
          data: l.data,
          address: l.address,
          blockHash: l.blockHash,
          transactionHash: l.transactionHash,
          transactionIndex: l.transactionIndex,
          blockNumber: l.blockNumber,
          removed: l.removed,
          description: logDescription,
          displayDescription: convertResultToDisplayResult(
            logDescription.fragment.inputs,
            logDescription.args,
          ),
        }
      }) || [],
    )

    this.#parsedError = rct.error
    if (this.#parsedError?.data) {
      const errorDescription = contractInterface.parseError(
        this.#parsedError.data,
      )
      if (errorDescription) {
        this.#parsedError.displayError =
          errorDescription.selector === '0x08c379a0'
            ? { reason: errorDescription.args[0] }
            : convertResultToDisplayResult(
                errorDescription.fragment.inputs,
                errorDescription.args,
              )
      }
    }
  }

  get receipt(): Partial<TransactionReceiptParams> {
    return this.resultData
  }

  get parsedLogs(): ReadonlyArray<
    LogParams & {
      description?: LogDescription
      displayDescription?: DisplayResult
    }
  > {
    return this.#parsedLogs
  }

  get parsedError() {
    return this.#parsedError
  }

  get simpleData() {
    return {
      hash: this.resultData.hash,
      from: this.resultData.from,
      to: this.resultData.to,
      gasUsed: this.resultData.gasUsed
        ? toBeHex(this.resultData.gasUsed)
        : undefined,
      error: this.parsedError?.displayError || this.parsedError,
      logs: this.parsedLogs.map((l) =>
        l.description && l.displayDescription
          ? {
              name: l.description.name,
              data: l.displayDescription,
            }
          : l,
      ),
    }
  }

  toJSON() {
    return JSON.parse(
      JSON.stringify(
        {
          receipt: this.resultData,
          parsedLogs: this.parsedLogs,
          error: this.parsedError,
        },
        jsonUtils.displayReplacer,
      ),
    )
  }
}
