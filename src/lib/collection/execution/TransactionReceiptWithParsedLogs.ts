import {
  Interface,
  LogDescription,
  LogParams,
  toBeHex,
  TransactionReceiptParams,
} from 'ethers'

import { jsonUtils } from '../../util'

import { convertResultToDisplayResult, DisplayResult } from './util'

export class TransactionReceiptWithParsedLogs {
  readonly receipt: TransactionReceiptParams
  readonly #parsedLogs: ReadonlyArray<
    LogParams & {
      description?: LogDescription
      displayDescription?: DisplayResult
    }
  >

  constructor(contractInterface: Interface, rct: TransactionReceiptParams) {
    this.receipt = rct
    this.#parsedLogs = Object.freeze(
      rct.logs.map((l) => {
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
      }),
    )
  }

  get parsedLogs(): ReadonlyArray<
    LogParams & {
      description?: LogDescription
      displayDescription?: DisplayResult
    }
  > {
    return this.#parsedLogs
  }

  get simpleData() {
    return {
      hash: this.receipt.hash,
      from: this.receipt.from,
      to: this.receipt.to,
      gasUsed: toBeHex(this.receipt.gasUsed),
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
          receipt: this.receipt,
          parsedLogs: this.parsedLogs,
        },
        jsonUtils.displayReplacer,
      ),
    )
  }
}
