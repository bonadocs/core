export function getDocsKey(dataKey: string, contractId?: string): string {
  if (contractId) {
    return `${contractId}.docs.${dataKey}`
  }

  return `docs.${dataKey}`
}

export function getInputDataKey(dataKey: string, contractId?: string): string {
  if (contractId) {
    return `${contractId}.inputs.${dataKey}`
  }

  return `inputs.${dataKey}`
}

export function tryFn<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch (e) {
    console.error(e)
    return undefined
  }
}
