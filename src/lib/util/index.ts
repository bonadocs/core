import { Interface } from 'ethers'

const jsonSubstitutionCode = 'bonadocs-json-substitution'
function jsonReplacer(_: string, v: unknown) {
  switch (typeof v) {
    case 'bigint':
      return {
        ctx: jsonSubstitutionCode,
        type: 'bigint',
        value: '0x' + v.toString(16),
      }
    default:
      return v
  }
}

function jsonDisplayReplacer(_: string, v: unknown) {
  switch (typeof v) {
    case 'bigint':
      return '0x' + v.toString(16)
    default:
      return v
  }
}

function jsonReviver(_: string, v: unknown) {
  if (!v) {
    return v
  }

  if (
    typeof v !== 'object' ||
    !('ctx' in v) ||
    !('value' in v) ||
    !('type' in v) ||
    v.ctx !== jsonSubstitutionCode ||
    typeof v.value !== 'string'
  ) {
    return v
  }

  switch (v.type) {
    case 'bigint':
      return BigInt(v.value)
    default:
      return v
  }
}

export const jsonUtils = {
  replacer: jsonReplacer,
  displayReplacer: jsonDisplayReplacer,
  reviver: jsonReviver,
}

export function createEthersInterface(abi: string) {
  return new Interface(normalizeABI(abi))
}

/**
 * Normalizes an ABI by removing duplicate entries.
 * @param abi
 */
export function normalizeABI(abi: string): string {
  return JSON.stringify(
    [
      ...new Set(
        JSON.parse(abi)
          .filter(
            (fragment: { type: string }) => fragment.type !== 'constructor',
          )
          .map(JSON.stringify),
      ),
    ]
      .sort()
      .map((s) => JSON.parse(s as string)),
  )
}
