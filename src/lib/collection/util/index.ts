import { id } from 'ethers'

/**
 * Generates a unique contract id based on the collection ID and ABI
 * @returns
 */
export function generateContractId(
  collectionId: string,
  interfaceHash: string,
): string {
  return generateId([collectionId, interfaceHash])
}

export function generateRandomId(): string {
  return generateId([Math.random().toString()])
}

function generateId(props: string[]): string {
  return id(props.join('\n')).slice(0, 10)
}

export function intersect(a: Set<number>, b: number[]): Set<number> {
  const intersection = new Set<number>()

  // remove from a if not in intersection
  for (const value of b) {
    if (!a.has(value)) {
      intersection.add(value)
    }
  }

  return intersection
}
